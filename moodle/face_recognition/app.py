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
        temp_image_path = os.path.join(UPLOAD_FOLDER, 'temp.jpg')
        save_base64_image(image_base64, temp_image_path)
        
        # Get all registered faces
        registered_faces = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith('.jpg') and f != 'temp.jpg']
        
        for face in registered_faces:
            try:
                # Compare faces
                result = DeepFace.verify(
                    img1_path=temp_image_path,
                    img2_path=os.path.join(UPLOAD_FOLDER, face),
                    model_name="Facenet",
                    distance_metric="cosine"
                )
                
                if result["verified"]:
                    student_id = face.replace('.jpg', '')
                    return jsonify({
                        'status': 'success',
                        'verified': True,
                        'student_id': student_id,
                        'confidence': result["distance"]
                    })
            except Exception as e:
                continue
        
        return jsonify({
            'status': 'success',
            'verified': False,
            'message': 'No matching face found'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    finally:
        # Clean up temporary file
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
