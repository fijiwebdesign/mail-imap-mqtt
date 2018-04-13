const mqtt = require('mqtt');

const PORT = process.env.PORT || 5000;
const MQTT_HOST = process.env.MQTT_HOST || 'mqtt://broker.hivemq.com';
const MQTT_PORT = process.env.MQTT_PORT || 1883;

const io = require('socket.io');

module.exports = function(PORT, client) {
  if (!client) {
    client = new mqtt.MQTTClient(MQTT_PORT, MQTT_HOST, 'pusher');
  }

  io.sockets.on('connection', function(socket) {
    socket.on('subscribe', function(data) {
      console.log('Subscribing to ' + data.topic);
      socket.join(data.topic);
      client.subscribe(data.topic);
    });
  });

  client.addListener('mqttData', function(topic, payload) {
    console.log('Received mqttData', topic, payload);
    io.sockets.in(topic).emit('mqtt', {
      topic: String(topic),
      payload: String(payload)
    });
  });

  io.listen(PORT);
};
