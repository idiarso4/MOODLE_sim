import axios from 'axios';

const MOODLE_URL = process.env.MOODLE_URL || 'http://moodle:8080';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

interface MoodleAttendance {
  courseid: number;
  studentid: number;
  status: number;
  sessdate: number;
  remarks: string;
}

export const syncAttendanceToMoodle = async (attendance: MoodleAttendance) => {
  try {
    const response = await axios.post(`${MOODLE_URL}/webservice/rest/server.php`, {
      wstoken: MOODLE_TOKEN,
      wsfunction: 'mod_attendance_update_status',
      moodlewsrestformat: 'json',
      ...attendance
    });

    return response.data;
  } catch (error) {
    console.error('Error syncing attendance to Moodle:', error);
    throw error;
  }
};

export const getMoodleCourses = async () => {
  try {
    const response = await axios.get(`${MOODLE_URL}/webservice/rest/server.php`, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: 'core_course_get_courses',
        moodlewsrestformat: 'json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching Moodle courses:', error);
    throw error;
  }
};

export const getMoodleStudents = async (courseId: number) => {
  try {
    const response = await axios.get(`${MOODLE_URL}/webservice/rest/server.php`, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: 'core_enrol_get_enrolled_users',
        courseid: courseId,
        moodlewsrestformat: 'json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching Moodle students:', error);
    throw error;
  }
};
