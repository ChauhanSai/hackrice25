from google import genai
from pydantic import BaseModel
from twelvelabs import TwelveLabs, core
import os
from twelvelabs.tasks import TasksRetrieveResponse
from dotenv import load_dotenv
import requests
from google.cloud import storage
load_dotenv()

client = TwelveLabs(api_key=os.getenv('TWELVELABS_API_KEY'))
gemini_client = genai.Client() # Uses the GEMINI_API_KEY env var

def genquiz(payload: str):
    class Question(BaseModel):
        question: str
        options: list[str]
        correct: str

    class Quiz(BaseModel):
        quiz: list[Question]

    
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Generate a 5 question quiz about important information to remember from the following telehealth transcript. The patient will be taking the quiz. " + payload,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[Quiz],
        },
    )

    print(response.text)

    return response.text

from flask import Flask, jsonify, request

app = Flask(__name__)

load_dotenv()

from flask_cors import CORS
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5000", "http://localhost:5000"])  # Enable CORS for specific origins

@app.route('/pegasus', methods = ['POST'])
def getResponse():
    try:
        json_data = request.get_json()
        query = json_data.get('query') if json_data else None
        vid_id = json_data.get('video_id') if json_data else None
    except:
        query = None
        vid_id = None
    try:
        response = client.analyze(
        video_id=vid_id,
        prompt = query
        )
        print(response.data)
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/merango', methods = ['POST'])
def getMerangoResponse():
    try:
        json_data = request.get_json()
        query = json_data.get('query') if json_data else None
    except:
        query = None
    
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Extract the core broad keyword from this query as a single word/phrase (e.g., 'what medicine should I take' → 'medicine'). Output only that. Query: {query}",
    )
    result = response.text
    print(result)
    merango_response = client.search.query(
        index_id=os.getenv("MERANGO_INDEX"),
        search_options=["visual", "audio"],
        query_text=response.text,
        group_by="video",
        operator="or",
        page_limit=5,
        sort_option="score",
        #adjust_confidence_level=0.5
    )
    print("Going to print response")
    print(merango_response.items[0])
    print(merango_response.items[0].clips[0])
    res = merango_response.items[0].clips[0]  # top most clip
    response_dict = {
        "start": res.start,
        "end": res.end,
        "id": res.video_id 
    }
    return jsonify(response_dict)
    


@app.route('/dark/transcript', methods=['GET'])
def gettranscript():
    try:
        video = request.args.get('v')
        index = request.args.get('i')
    except:
        video = None
        index = None

    if video is None or index is None:
        return {"error": "Missing video-id or index-id"}

    # Else run processing
    url = f'https://api.twelvelabs.io/v1.3/indexes/{index}/videos/{video}'
    querystring = {"transcription": "true"}
    TWELEVELABS_API_KEY = os.getenv('TWELVELABS_API_KEY')
    headers = {"x-api-key": TWELEVELABS_API_KEY}

    response = requests.get(url, headers=headers, params=querystring)

    transcription = response.json()['transcription']
    transcript = ""
    for i in transcription:
        if " " in i['value']:
            transcript += i['value']
        else:
            transcript += " " + i['value']

    json_transcript = {"transcript": transcript}
    print(json_transcript)
    return json_transcript


@app.route('/dark/quiz', methods=['POST'])
def sendquiz():
    try:
        hsp = request.args.get('hsp')
    except:
        hsp = None

    json_data = request.get_json(silent=True)
    payload = json_data.get('transcription') if json_data else None

    try:
        hsp_header = request.headers.get('X-HSP-Header')
    except:
        hsp_header = None

    if hsp is None:
        return {"error": "Missing 'hsp' parameter"}
    if not hsp_header == hsp:
        return {"error": "HSP security check failed"}

    # Else run processing
    if json_data:
        quiz = genquiz(payload)
    else:
        return {"error": "Missing JSON body with 'transcript'"}

    # print("Flask API is returning", response)
    return jsonify(quiz)


@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        index = request.args.get('i')
    except:
        index = None

    if index is None:
        return {"error": "Missing 'index' parameter"}

    if 'file' not in request.files:
        return {"error": "No file part in the request"}

    file = request.files['file']

    if file.filename == '':
        return {"error": "No selected file"}

    if file:
        os.getenv("GOOGLE-CLOUD-JSON-ABS-PATH")
        GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE-CLOUD-JSON-ABS-PATH")
        bucket_name, source_file_name, destination_blob_name = "hackrice-2025", file, file.filename
        storage_client = storage.Client(project="rice-hackathon25iah-613")

        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)

        # Upload file
        blob.upload_from_file(file, content_type=file.content_type)

        # Make public
        blob.make_public()

        # Return the public URL
        print("Initial Public URL:", blob.public_url)

        url = "https://api.twelvelabs.io/v1.3/tasks"

        files_payload = {
            "video_url": blob.public_url,
        }
        payload = {
            "video_url": blob.public_url,
            "index_id": index,
        }
        headers = {"x-api-key": os.getenv('TWELVELABS_API_KEY')}

        response = requests.post(url, files=files_payload, data=payload, headers=headers)

        print("Twelvelabs Video ID:", response.json()['video_id'])
        new_blob_name = response.json()['video_id'] + destination_blob_name[destination_blob_name.rfind('.'):]

        blob = bucket.blob(destination_blob_name)

        # Copy the blob to the new name with metadata (including content_type)
        new_blob = bucket.copy_blob(
            blob,
            bucket,
            new_blob_name,
            preserve_acl=True  # optional: keep ACLs
        )

        # Ensure content_type is set on the new blob
        if blob.content_type:
            new_blob.content_type = blob.content_type
            new_blob.patch()  # updates metadata in GCS

        # Delete the old blob
        blob.delete()

        # Make public
        new_blob.make_public()

        print("Final Public URL:", new_blob.public_url)

        return {"url": new_blob.public_url, "video_id": response.json()['video_id']}

if __name__ == '__main__':
    app.run(debug=True, port=5001)

    # DEBUG