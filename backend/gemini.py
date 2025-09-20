import requests
import dotenv
from google import genai
from pydantic import BaseModel

dotenv.load_dotenv()
import os
API_KEY = os.getenv('GEMINI_API_KEY')

def genquiz(payload: str):
    class Question(BaseModel):
        question: str
        options: list[str]
        correct: str

    class Quiz(BaseModel):
        quiz: list[Question]

    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Generate a 5 question quiz about important information to remember from the following telehealth transcript. " + payload,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[Quiz],
        },
    )

    print(response.text)

    return response.text

from flask import Flask, jsonify, request

app = Flask(__name__)

from flask_cors import CORS
CORS(app)  # Enable CORS for all routes

@app.route('/dark/quiz', methods=['GET'])
def sendquiz():
    try:
        hsp = request.args.get('hsp')
    except:
        hsp = None

    json_data = request.get_json(silent=True)
    payload = json_data.get('transcript') if json_data else None

    try:
        hsp_header = request.headers.get('X-HSP-Header')
    except:
        hsp_header = None

    if hsp is None:
        return {"error": "Missing 'hsp' parameter"}
    if hsp_header is not hsp:
        return {"error": "HSP security check failed"}

    # Else run processing
    if json_data:
        quiz = genquiz(payload)
    else:
        return {"error": "Missing JSON body with 'transcript'"}

    # print("Flask API is returning", response)
    return jsonify(quiz)

if __name__ == '__main__':
    # app.run(debug=True, port=5001)

    genquiz("""
    Hi Mr petrol I’m Unice I’m one of the nurses helping out at the hospital that you were recently discharged at. So I’m just going to provide you some post discharge instructions since you had um hypertension issue um in the hospital is that correct.

That’s correct. Okay so your doctor said that you’re going to be taking like 10 milligrams of hydroline. I’m pretty sure they uh didn’t really tell you much what hydroline is for. Have you ever taken any high blood pressure medications?

I have not I have no idea what it’s for they didn’t exp.

Okay so hydrazine is a medicine that’s used to treat high blood pressure. Basically it relaxes the blood vessel so that your relaxes the blood vessel so that blood can flow through your body better cuz you know when you’re um when you have small blood vessels you can have high blood pressure.

Um I heard you told the doctor earlier that you have some trouble trying to figure out what’s a good time to take your medication. Um you have trouble trying to adhere to those medications. Um so around dinner time I’m assuming is a great time to take that 10 milligrams hydrazine.

Okay so take it um when you eat.

G to keep me up.

No if it um if you do forget to take the medication I would not wait later in a day to take it. I would just skip the dose and wait till the next day to take it.

Um some side effects do you side effects of hydrazine could be like headaches and stomach upsets stomach upset so make sure you take it with food is why I was saying that dinner time is a great time.

Okay um do you have any health care concerns about taking hydrazine?

Uh I read on the internet a bit that it can be bad for your kidneys is that something I should be concerned about.

Um for hyding compared to other high blood pressure medications this one should be a little bit easier on the kidneys.

So okay do you have any like cultural or religious beliefs or preferences about taking hydrazine or no.

Nothing in that.

Okay um do you have any questions or concerns about your plan of care with taking hydroline?

Uh do we know about how long I’ll have to be taking it?

Um I would say you’ll be doctor said you’ll be taking it for about maybe six months to see how you do because you’re generally very healthy young adult and that really we should try and see if we can modify some diet like no smoking or reduce your sodium intake and stress us.

Gotcha so okay um can you tell me what okay so I’m just going to ask can you tell me why we’re taking hydrology now I’m just trying to see if you understand.

Yeah taking it to lower my blood pressure.

Okay that was concerned.

All right so I’d like to do a follow-up appointment are you available anytime in in the week in thec.

Uh let me check yes uh first week of December would be fine.

Okay do you want to do December 4th at like are you a morning person evening person.

Definitely evening.

Okay evening.

Um so we’ll skill to you like 5:00 pm.

All right okay that’s it.""")