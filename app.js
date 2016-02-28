var Cylon = require('cylon');

Cylon.robot({
  connections: {
    edison: { adaptor: 'intel-iot' }
  },
  devices: {
    led: { driver: 'led', pin: 13 },
    sound: { driver: "analogSensor",  pin: 2, connection: "edison" }
  },
  writeMessage: function(message, color) {
    var str = message.toString();
    while (str.length < 16) {
      str = str + " ";
    }
    this.screen.setCursor(0,0);
    this.screen.write(str);
    switch(color)
    {
      case "red":
        this.screen.setColor(255, 0, 0);
        break;
      case "green":
        this.screen.setColor(0, 255, 0);
        break;
      case "blue":
        this.screen.setColor(0, 0, 255);
        break;
      default:
        this.screen.setColor(255, 255, 255);
        break;
    }
  },
  detectSound: function(val) {
    var that = this;
    if (val >= 450) {
      that.led.turnOn();
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
  }
}).start();
