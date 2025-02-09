const amqp = require('amqplib');

let channel = null;

// Function to connect to RabbitMQ server
async function connect() {
    try {
        const rabbitmqUrl = process.env.RABBIT_URL || 'amqp://your-cloud-rabbitmq-url'; // Replace with your cloud RabbitMQ URL
        const connection = await amqp.connect(rabbitmqUrl);
        channel = await connection.createChannel();
        console.log("connected to RabbitMQ");
    } catch (err) {
        console.error('Failed to connect to RabbitMQ', err);
        throw err;
    }
}

// Function to publish a message to a queue
async function publishToQueue(queueName, message) {
    if (!channel) {
        throw new Error('Channel is not created');
    }
    await channel.assertQueue(queueName, {
        durable: false
    });
    await channel.sendToQueue(queueName, Buffer.from(message));
    console.log(`Message sent to queue ${queueName}: ${message}`);
}

// Function to subscribe to a queue
async function subscribeQueue(queueName, callback) {
    if (!channel) {
        throw new Error('Channel is not created');
    }
    await channel.assertQueue(queueName, {
        durable: false
    });
    await channel.consume(queueName, (msg) => {
        if (msg !== null) {
            console.log(`Message received from queue ${queueName}: ${msg.content.toString()}`);
            callback(msg.content.toString());
            channel.ack(msg);
        }
    });
}

module.exports = {
    connect,
    publishToQueue,
    subscribeQueue
};