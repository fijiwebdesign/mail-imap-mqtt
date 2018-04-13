/**
 * Mail Client
 */
const mqtt = require('mqtt');

const MQTT_HOST = process.env.MQTT_HOST || 'mqtt://broker.hivemq.com';
const client = mqtt.connect(MQTT_HOST);

let mailState = '';
let connected = false;

client.on('connect', () => {
  console.log('Connected, subscribing...');
  client.subscribe('mail/connected');
  client.subscribe('mail/state');
  client.publish('client/connected', 'true');
});

client.on('message', (topic, message) => {
  switch (topic) {
    case 'mail/connected':
      return handleMailConnected(message);
    case 'mail/state':
      return handleMailState(message);
  }
  console.log('No handler for topic %s', topic);
});

function handleMailConnected(message) {
  console.log('mail connected status %s', message);
  connected = message.toString() === 'true';
}

function handleMailState(message) {
  mailState = message;
  console.log('mail state update to %s', message);
}

function openMail() {
  // can only open mail if we're connected to mqtt and mail isn't already open
  if (connected && mailState !== 'open') {
    // Ask the mail to open
    client.publish('mail/open', 'true');
  }
}

function closeMail() {
  // can only close mail if we're connected to mqtt and mail isn't already closed
  if (connected && mailState !== 'closed') {
    // Ask the mail to close
    client.publish('mail/close', 'true');
  }
}

// --- Connect and test ----//

// promise mail connected
function onceMailConnected(timeout = 5000) {
  return new Promise((resolve, reject) => {
    var timer = setTimeout(() => reject(), timeout);
    client.once('message', (topic, message) => {
      if (topic === 'mail/connected') {
        resolve(message);
      }
    });
  });
}

onceMailConnected()
  .then(() => {
    // simulate opening mail
    setTimeout(() => {
      console.log('open mailbox');
      openMail();
    }, 5000);

    // simulate closing mail
    setTimeout(() => {
      console.log('close mailbox');
      closeMail();
    }, 20000);
  })
  .catch(() => {
    console.log('Failed to connect to mail');
  });
