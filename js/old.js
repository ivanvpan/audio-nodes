            var audioContext,
                audioBuffer,
                analyserNode,
                scriptNode,
                combineNode,
                delayNode,
                oscNode,
                gainNode,
                lowpassNode,

                //canvas
                ctx;

            function initAudio() {
                audioContext = new webkitAudioContext();

                analyserNode = audioContext.createAnalyser();

                gainNode = audioContext.createGainNode();
                gainNode.gain.value = 0.5;
                gainNode.connect(audioContext.destination);

                scriptNode = audioContext.createScriptProcessor(1024, 1, 1);
                scriptNode.onaudioprocess = function (event) {
                    var input = event.inputBuffer.getChannelData(0),
                        output = event.outputBuffer.getChannelData(0);
                    for (var i = 0; i < input.length; i++) {
                        var val = input[i],
                            sign = (val / Math.abs(val));

                        // pow
                        val = sign * Math.pow(Math.abs(val), 2);

                        //clip
                        var clipTo = 0.4;
                        if (Math.abs(val) > clipTo) {
                            val = sign * (clipTo + 0.2 * (Math.abs(val) - clipTo));
                        }

                        output[i] = val;
                    }
                };
                scriptNode.connect(gainNode); //final before gain

                delayNode = audioContext.createDelayNode();
                delayNode.delayTime.value = 0.3;
                delay1Node = audioContext.createDelayNode();
                delay1Node.delayTime.value = 0.2;
                delay2Node = audioContext.createDelayNode();
                delay2Node.delayTime.value = 0.1;

                combineNode = audioContext.createGainNode();
                combineNode.gain.value = 1;
                combineNode.connect(scriptNode);

                decayNode = audioContext.createGainNode();
                decayNode.gain.value = 0.3;
                decayNode.connect(combineNode);

                combineNode.connect(delayNode);
                combineNode.connect(delay1Node);
                combineNode.connect(delay2Node);
                delayNode.connect(decayNode);
                //delay1Node.connect(decayNode);
                //delay2Node.connect(decayNode);

                lowpassNode = audioContext.createBiquadFilter();
                lowpassNode.type = 'lowpass';
                lowpassNode.Q.value = 1;
                lowpassNode.frequency.value = 400;
                lowpassNode.connect(combineNode);

                highpassNode = audioContext.createBiquadFilter();
                highpassNode.type = 'highpass';
                highpassNode.Q.value = 2;
                highpassNode.frequency.value = 10;
                highpassNode.connect(lowpassNode);
                gainNode.connect(analyserNode);

                document.getElementById('thebutton').addEventListener('click', function() {
                    play(200);
                    //play(220.01);
                    //play(219.99);
                });
                document.getElementById('stopbutton').addEventListener('click', function() {
                    oscNode.stop(0);
                });
            };

            function play(freq) {
                if (oscNode) return;
                oscNode = audioContext.createOscillator();
                oscNode.frequency.value = freq;
                oscNode.type = 'square';
                oscNode.connect(highpassNode);
                oscNode.start(0);

                setInterval(function() {
                    draw();
                }, 1000);
            }

            function draw() {
                ctx.fillStyle = 'rgb(230, 230, 230)';
                ctx.fillRect(0, 0, 400, 200);
                var size = 2032,
                    width = 400,
                    height = 200,
                    data = new Uint8Array(2032);
                analyserNode.getByteTimeDomainData(data);
                ctx.fillStyle = 'rgb(0, 0, 180)';
                for (var i = 0; i < size; i++) {
                    var x = Math.round(width * (i / size)),
                        y = height * ((255 - data[i]) / 255);
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            function initCanvas() {
                ctx = document.getElementById('canvas').getContext('2d');
            }

            function init() {
                initAudio();
                initCanvas();
            }


            function loadSound(url) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';
                request.onload = function () {
                    var source = audioContext.createBufferSource(),
                        buffer = audioContext.createBuffer(this.response, true);
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.start(0);
                };
                request.send();
            }
