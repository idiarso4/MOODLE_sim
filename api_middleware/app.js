const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const MOODLE_URL = process.env.MOODLE_URL;
const FACE_RECOGNITION_URL = process.env.FACE_RECOGNITION_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

// Register student face
app.post('/register-face', async (req, res) => {
    try {
        const { student_id, image } = req.body;
        
        // Register face with face recognition service
        const faceResponse = await axios.post(`${FACE_RECOGNITION_URL}/register`, {
            student_id,
            image
        });
        
        res.json(faceResponse.data);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Verify face and mark attendance
app.post('/mark-attendance', async (req, res) => {
    try {
        const { image, course_id, session_id } = req.body;
        
        // Verify face
        const faceResponse = await axios.post(`${FACE_RECOGNITION_URL}/verify`, {
            image
        });
        
        if (faceResponse.data.matched) {
            // Mark attendance in Moodle
            const moodleResponse = await axios.post(`${MOODLE_URL}/webservice/rest/server.php`, {
                wstoken: MOODLE_TOKEN,
                wsfunction: 'mod_attendance_save_attendance',
                moodlewsrestformat: 'json',
                sessionid: session_id,
                studentid: faceResponse.data.student_id,
                statusid: 1 // Present
            });
            
            res.json({
                status: 'success',
                message: 'Attendance marked successfully',
                student_id: faceResponse.data.student_id
            });
        } else {
            res.status(401).json({
                status: 'error',
                message: 'Face not recognized'
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Middleware running on port ${PORT}`);
});
