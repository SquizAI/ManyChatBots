/**
 * Logger Utility
 * Provides consistent logging functionality across the application
 */

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if available
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            )
        })
    ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    // Log directory
    const logDir = process.env.LOG_DIR || 'logs';
    
    // Add file transports
    logger.add(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error'
    }));
    
    logger.add(new winston.transports.File({
        filename: path.join(logDir, 'combined.log')
    }));
}

// Export logger instance
module.exports = logger;
