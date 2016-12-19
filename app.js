(function (window) {
    var getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    var vm = new Vue({
        el: "#app",
        data: {
            width: 800,
            height: 450,
            benchTimes: 100,
            x1: null,
            y1: null,
            x2: null,
            y2: null,
            canvas: null,
            context: null,
            renderTime: null,
            renderXTime: null,
            busy: false,
            drawers: {
                'Null': function (x1, y1, x2, y2, drawPoint, ready) {
                    ready();
                }
            },
            selectedDrawer: 'Null',
            pointsDrawn: null,
            performBench: true
        },
        computed: {
            url: function () {
                var
                    components = [this.x1, this.y1, this.x2, this.y2],
                    location = "" + window.location
                ;

                components.push(this.selectedDrawer);

                if (location.indexOf('#') !== -1) {
                    location = location.split('#')[0];
                }

                return location + '#' + components.join('-');
            }
        },
        created: function () {
            if (!this.readHash()) {
                this.generateRandomPoints();
            }
        },
        mounted: function() {
            this.canvas = this.$el.getElementsByTagName('canvas')[0];
            this.context = this.canvas.getContext("2d");
        },
        methods: {
            generateRandomPoints: function () {
                this.x1 = getRandomInt(0, this.width);
                this.y1 = getRandomInt(0, this.height);
                this.x2 = getRandomInt(0, this.width);
                this.y2 = getRandomInt(0, this.height);
            },
            draw: function (ready) {
                this.drawers[this.selectedDrawer](this.x1, this.y1, this.x2, this.y2, this.point.bind(this), ready);
            },
            update: function () {
                if (this.busy) {
                    return;
                }

                this.busy = true;
                this.pointsDrawn = null;
                this.renderTime = null;
                this.renderXTime = null;

                var self = this;
                this.doBench(function () {
                    setTimeout(function () {
                        self.initialDraw();
                        var drawStartTime = performance.now();
                        self.pointsDrawn = 0;
                        self.draw(function () {
                            self.renderTime = performance.now() - drawStartTime;
                            self.busy = false;
                        });
                    }, 100);
                });
            },
            initialDraw: function () {
                this.clear();
                this.point(this.x1, this.y1);
                this.point(this.x2, this.y2);

                this.context.beginPath();
                this.context.arc(this.x1, this.y1, 3, 0, 2 * Math.PI);
                this.context.stroke();

                this.context.beginPath();
                this.context.arc(this.x2, this.y2, 3, 0, 2 * Math.PI);
                this.context.stroke();
            },
            point: function (x, y) {
                this.context.fillRect(x, y, 1, 1);
                this.pointsDrawn++;
            },
            clear: function () {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            },
            readHash: function () {
                var hash = window.location.hash;

                if (!hash) {
                    return false;
                }

                hash = hash.substr(1).split('-');

                if (hash.length < 4) {
                    return false;
                }

                this.x1 = parseInt(hash[0]);
                this.y1 = parseInt(hash[1]);
                this.x2 = parseInt(hash[2]);
                this.y2 = parseInt(hash[3]);

                if (hash.length > 4) {
                    this.selectedDrawer = hash[4];
                }

                return true;
            },
            doBench: function (resolve) {
                if (!this.performBench) {
                    resolve();

                    return;
                }

                var self = this;

                setTimeout(function () {
                    var drawStartTime = performance.now();
                    var times = self.benchTimes;
                    self.pointsDrawn = 0;
                    var run = function () {
                        self.clear();
                        self.draw(function () {
                            if (times-- <= 0) {
                                self.renderXTime = performance.now() - drawStartTime;
                                resolve();
                            } else {
                                run();
                            }
                        });
                    };
                    run();
                }, 100);
            }
        },
        watch: {
            x1: function () {
                this.update();
            },
            y1: function () {
                this.update();
            },
            x2: function () {
                this.update();
            },
            y2: function () {
                this.update();
            },
            selectedDrawer: function () {
                this.update();
            },
            performBench: function () {
                this.update();
            }
        },
        filters: {
            'float': function (value, fraction) {
                if (typeof(fraction) === 'undefined') {
                    fraction = 2;
                }

                if (value !== null) {
                    var result = parseFloat(value);

                    if (!isNaN(result)) {
                        return result.toFixed(fraction);
                    }
                }

                return '-';
            },
            'int': function (value) {
                if (value !== null) {
                    var result = parseInt(value);

                    if (!isNaN(result)) {
                        return result;
                    }
                }

                return '-';
            }
        }
    });

    if ("onhashchange" in window.document.body) {
        window.onhashchange = function () {
            vm.readHash();
        };
    }

    window.appAddDrawer = function (name, fn) {
        vm.drawers[name] = fn;
    };
})(window);
