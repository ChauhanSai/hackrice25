from google import genai
from pydantic import BaseModel
from twelvelabs import TwelveLabs, core
import os
from twelvelabs.tasks import TasksRetrieveResponse
from dotenv import load_dotenv
import requests
load_dotenv()

client = TwelveLabs(api_key=os.getenv('TWELVELABS_API_KEY'))

def genquiz(payload: str):
    class Question(BaseModel):
        question: str
        options: list[str]
        correct: str

    class Quiz(BaseModel):
        quiz: list[Question]

    client = genai.Client() # Uses the GEMINI_API_KEY env var
    response = client.models.generate_content(
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
CORS(app)  # Enable CORS for all routes

@app.route('/pegasus', methods = ['POST'])
def getResponse():
    try:
        query = request.args.get('query')
        vid_id = request.args.get('video_id')
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

if __name__ == '__main__':
    app.run(debug=True, port=5001)

    # DEBUG