from flask import Flask, request, jsonify
from deepface import DeepFace
import numpy as np
import cv2
import os
import base64

app = Flask(__name__)

UPLOAD_FOLDER = '/app/data'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def save_base64_image(base64_string, file_path):
    img_data = base64.b64decode(base64_string)
    with open(file_path, 'wb') as f:
        f.write(img_data)
    return file_path

@app.route('/register', methods=['POST'])
def register_face():
    try:
        data = request.json
        student_id = data['student_id']
        image_base64 = data['image']
        
        # Save image
        image_path = os.path.join(UPLOAD_FOLDER, f'{student_id}.jpg')
        save_base64_image(image_base64, image_path)
        
        # Extract face embeddings
        embedding = DeepFace.represent(image_path, model_name="Facenet")
        
        return jsonify({
            'status': 'success',
            'message': 'Face registered successfully',
            'student_id': student_id
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/verify', methods=['POST'])
def verify_face():
    try:
        data = request.json
        image_base64 = data['image']
        
        # Save temporary image
        temp_path = os.path.join(UPLOAD_FOLDER, 'temp.jpg')
        save_base64_image(image_base64, temp_path)
        
        # Find matching face
        result = DeepFace.find(
            img_path=temp_path,
            db_path=UPLOAD_FOLDER,
            model_name="Facenet"
        )
        
        if len(result) > 0:
            matched_path = result[0].identity[0]
            student_id = os.path.splitext(os.path.basename(matched_path))[0]
            return jsonify({
                'status': 'success',
                'matched': True,
                'student_id': student_id
            })
        
        return jsonify({
            'status': 'success',
            'matched': False
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
