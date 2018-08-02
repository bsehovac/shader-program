;(function() {
  'use strict';

  PS.FPS = function(styles) {
    var _this = this;
    var _domElement = document.createElement('div');

    _domElement.innerHTML = 0;

    _this.elapsed = 0;
    _this.frame = 0;
    _this.domElement = _domElement;

    if (styles) _this.styles();

    return _this;
  };

  PS.FPS.prototype.update = function(delta) {
    var _this = this;

    _this.frame ++;
    _this.elapsed += delta;

    if (_this.elapsed >= 1000) {
      _this.domElement.innerHTML = _this.frame;
      _this.frame = 0;
      _this.elapsed -= 1000;
    }
  };

  PS.FPS.prototype.styles = function() {
    var _this = this;
    var _domElement = _this.domElement;

    _domElement.style.cssText =
      'position: absolute; top: 10px; left: 10px; z-index: 2;' +
      'padding: 3px 5px; font-size: 13px; font-weight: bold;' +
      'background: rgba(0,0,0,0.5); color: #fff; border-radius: 5px;'
  };

})();
