/**
 * Mail Server
 */
const mqtt = require('mqtt');

const MQTT_HOST = process.env.MQTT_HOST || 'mqtt://broker.hivemq.com';
const client = mqtt.connect(MQTT_HOST);

/**
 * The state of the mail, defaults to closed
 * Possible states : closed, opening, open, closing
 */
var state = 'closed';

client.on('connect', () => {
  console.log('Connected, subscribing...');
  client.subscribe('mail/open');
  client.subscribe('mail/close');
  client.subscribe('client/connected');
});

client.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message);
  switch (topic) {
    case 'mail/open':
      return handleOpenRequest(message);
    case 'mail/close':
      return handleCloseRequest(message);
    case 'client/connected':
      return handleClientConnected(message);
  }
});

function sendStateUpdate() {
  console.log('sending state %s', state);
  client.publish('mail/state', state);
}

function handleOpenRequest(message) {
  if (state !== 'open' && state !== 'opening') {
    console.log('opening mail');
    state = 'opening';
    sendStateUpdate();

    // simulate mail open after 5 seconds (would be listening to hardware)
    setTimeout(() => {
      state = 'open';
      sendStateUpdate();
    }, 5000);
  }
}

function handleCloseRequest(message) {
  if (state !== 'closed' && state !== 'closing') {
    state = 'closing';
    sendStateUpdate();

    // simulate mail closed after 5 seconds (would be listening to hardware)
    setTimeout(() => {
      state = 'closed';
      sendStateUpdate();
    }, 5000);
  }
}

function handleClientConnected(message) {
  // Inform clients that mail is connected
  client.publish('mail/connected', 'true');
  sendStateUpdate();
}

/**
 * Want to notify client that mail is disconnected before shutting down
 */
function handleAppExit(options, err) {
  if (err) {
    console.error('App exited due to error', err);
  }

  if (options.cleanup) {
    client.publish('mail/connected', 'false');
  }

  if (options.exit) {
    process.exit();
  }
}

/**
 * Handle the different ways an application can shutdown
 */
process.on(
  'exit',
  handleAppExit.bind(null, {
    cleanup: true
  })
);
process.on(
  'SIGINT',
  handleAppExit.bind(null, {
    exit: true
  })
);
process.on(
  'uncaughtException',
  handleAppExit.bind(null, {
    exit: true
  })
);
