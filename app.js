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
  detectSound: function(val) {
    var that = this;
    if (val >= 450) {
      if (val > 1000) val = 1000;
      var multiplier = (val - 450) / 500;
      var red = Math.round(multiplier * 255);
      var green = Math.round((1 - multiplier) * 255);
      var blue = Math.round((1 - multiplier) * 255);
      that.led.turnOn();
      that.writeMessage("BABY IS CRYING", red, green, blue);
      if (!that.hasEmitted) {
        socket.emit('cry', {"temp": that.temp ,"reason":"crying" });
      }
      setTimeout(function() {
        that.reset();
      }, 500);
    }
  },
  reset: function() {
    this.led.turnOff();
  },
  work: function(my) {
    my.sound.on('analogRead', function(val) {
      my.detectSound(val);
    });

    setInterval(function() {
      my.temp = my.tempSensor.value();
      my.writeMessage(my.temp);
    }, 5000);
  }
});
