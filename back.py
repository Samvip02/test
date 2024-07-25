# flask_server.py
from flask import Flask, request, jsonify
import whisper
import openai
import os
import traceback

app = Flask(__name__)

# Load Whisper model
try:
    model = whisper.load_model("base")
    print("Whisper model loaded successfully.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    traceback.print_exc()

# Set your OpenAI API key
openai.api_key = 'sk-None-niBZbbOjoeDwJjTPhEseT3BlbkFJPfto44NpHQKKs51PDc5G'

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        # Ensure the request has an audio file
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file found in the request.'}), 400

        audio_file = request.files['audio']
        file_path = os.path.join("uploads", audio_file.filename)
        audio_file.save(file_path)

        # Transcribe the audio using Whisper
        try:
            transcription_result = model.transcribe(file_path)
            text = transcription_result['text']
        except Exception as e:
            print(f"Error during Whisper transcription: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Whisper transcription failed.'}), 500

        # Clean up the saved file
        os.remove(file_path)

        # Process the transcription with ChatGPT
        try:
            time_format = get_time_from_text(text)
        except Exception as e:
            print(f"Error during ChatGPT processing: {e}")
            traceback.print_exc()
            return jsonify({'error': 'ChatGPT processing failed.'}), 500

        return jsonify({'transcription': text, 'time_format': time_format})

    except Exception as e:
        print(f"Unexpected error during request handling: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def get_time_from_text(text):
    try:
        response = openai.Completion.create(
            engine="davinci",  # You can use another model if needed
            prompt=f"Extract the time format from the following text: {text}",
            max_tokens=50
        )
        time_format = response.choices[0].text.strip()
        return time_format

    except Exception as e:
        print(f"Error during OpenAI API call: {e}")
        traceback.print_exc()
        return "Error extracting time format"

if __name__ == '__main__':
    # Ensure the "uploads" directory exists
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    app.run(debug=True)
