import Joi from 'joi';

export const userSchemas = {
    create: Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().min(3).max(50).required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('ADMIN', 'TEACHER', 'STUDENT').required()
    }),

    update: Joi.object({
        email: Joi.string().email(),
        name: Joi.string().min(3).max(50),
        password: Joi.string().min(6),
        role: Joi.string().valid('ADMIN', 'TEACHER', 'STUDENT')
    })
};

export const classSchemas = {
    create: Joi.object({
        name: Joi.string().min(3).max(100).required(),
        teacherId: Joi.string().required(),
        schedules: Joi.array().items(
            Joi.object({
                dayOfWeek: Joi.number().min(0).max(6).required(),
                startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            })
        )
    }),

    update: Joi.object({
        name: Joi.string().min(3).max(100),
        teacherId: Joi.string()
    })
};

export const scheduleSchemas = {
    create: Joi.object({
        classId: Joi.string().required(),
        dayOfWeek: Joi.number().min(0).max(6).required(),
        startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    }),

    generateSessions: Joi.object({
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
    })
};

export const attendanceSchemas = {
    mark: Joi.object({
        sessionId: Joi.string().required(),
        method: Joi.string().valid('FACE', 'QR_CODE', 'MANUAL').required(),
        location: Joi.object({
            lat: Joi.number().min(-90).max(90).required(),
            lng: Joi.number().min(-180).max(180).required()
        }),
        image: Joi.string().when('method', {
            is: 'FACE',
            then: Joi.required()
        }),
        qrCode: Joi.string().when('method', {
            is: 'QR_CODE',
            then: Joi.required()
        })
    })
};
