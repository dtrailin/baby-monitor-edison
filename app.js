var Cylon = require('cylon');
var io = require('socket.io-client');
var socket = io.connect('http://45.79.134.17:7777', {reconnect: true});

socket.on('connect', function() {
  console.log('Connected to Server');
  Cylon.start();
});

socket.on('cry', function() {
  console.log('Cry received from server');
});

Cylon.robot({
  connections: {
    edison: { adaptor: 'intel-iot' }
  },
  devices: {
    led: { driver: 'led', pin: 13 },
    sound: { driver: 'analogSensor',  pin: 2, connection: 'edison' },
    tempSensor: {driver: 'upm-grovetemp', pin: 1, connection: 'edison'},
    screen: { driver: 'upm-jhd1313m1', connection: 'edison'},
    touch: { driver: 'button', pin: 8, connection: 'edison'}
  },
  temp: 0,
  writeMessage: function(message, r, g, b) {
    var str = message.toString();
    while (str.length < 16) {
      str = str + " ";
    }
    this.screen.setCursor(0, 0);
    this.screen.write(str);
    if (r == undefined || g == undefined || b == undefined) return;
    this.screen.setColor(r, g, b);
  },
  isEnabled: true,
  detectSound: function(val) {
    var that = this;
    var oldVal = val;
    if (val >= 450 && that.isEnabled) {
      if (val > 1000) val = 1000;
      if (val < 667) {
        that.writeMessage("Baby is waking", 255, 255, 0);
      } else if (val < 834) {
        that.writeMessage("BABY IS ANGRY!!", 255, 165, 0);
      } else if (val <= 1000) {
        that.writeMessage("RUUUUNNN!!", 100, 0, 0);
      }

      that.led.turnOn();
      // that.writeMessage("BABY IS CRYING", red, green, blue);
      socket.emit('cry', {'temp': that.temp, 'reason': 'Crying', 'threshold': oldVal});
      that.isEnabled = false;
      setTimeout(function() {
        that.reset();
      }, 500);
      setTimeout(function() {
        that.isEnabled = true;
      }, 3000);
    }
  },
  parentNeeded: function() {
    socket.emit('cry', {'temp': this.temp, 'reason': 'Parent Needed!', 'threshold': 0});
    this.writeMessage('Parent Needed!', 255, 0, 255);
  },
  reset: function() {
    this.led.turnOff();
  },
  work: function(my) {
    my.sound.on('analogRead', function(val) {
      my.detectSound(val);
    });

    my.touch.on('push', function() {
      my.parentNeeded();
    });

    setInterval(function() {
      my.temp = my.tempSensor.value();
      if (my.temp >= 25) {
        socket.emit('cry', {'temp': my.temp, 'reason': 'TOO HOT', 'threshold': 0});
      }
      my.writeMessage(my.temp.toString() + ' C');
    }, 5000);
  }
});
