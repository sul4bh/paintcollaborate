var socket_uri = 'http://127.0.1:3000/';

paper.install(window);

var state = {
    unique_id: '',
    namespace: '',
    recent_path: '',
    overlay: ''
};

var onLoadFunctions = {
    generateToolWidths: function() {
        var toolWidth = [1, 2, 3, 4, 8, 10, 16, 20];
        var row = $('<div class="row"></div>');
        var widthItem;
        for(var width in toolWidth) {
            widthItem = $('<div data-width="' + toolWidth[width] + '" class="small-1 columns width-item"><span></span></div>');
            $('span',widthItem).css('border-width', toolWidth[width]);
            row.append(widthItem);
        }
        $('#widths').append(row);

        row.children().first().addClass('small-offset-2');
    },

    generatePalette: function(){
        //#https://github.com/mrmrs/colors
        var colors = {
            black: "#111",
            aqua: "#7FDBFF",
            blue: "#0074D9",
            lime: "#01FF70",
            navy: "#001F3F",
            teal: "#39CCCC",
            olive: "#3D9970",
            green: "#2ECC40",
            red: "#FF4136",
            maroon: "#85144B",
            orange: "#FF851B",
            purple: "#B10DC9",
            yellow: "#FFDC00",
            fuchsia: "#F012BE",
            gray: "#aaa",
            white: "#fff"
        };

        var row;
        var i = -1;
        for(var color in colors){
            i++;
            if (i%8 == 0){
                $('.small-1:last-child', row).addClass('end');
                row = $('<div class="row"></div>');
                $('#palette').append(row);
                row.
                    append('<div data-color="'+ colors[color] +'" class="small-1 small-offset-2 columns item bg-'+color+'">&nbsp;</div>');
                continue;
            }
            row.
                append('<div data-color="'+ colors[color] +'" class="small-1 columns item bg-'+color+'">&nbsp;</div>');

        }
        $('.small-1:last-child', row).addClass('end');
    },

    enableToolWidth: function() {
        $('.width-item', $('#widths')).on('click', function(event){
            $('.width-item', $('#widths')).removeClass('active');
            $(this).addClass('active');
            paper.strokeWidth = $(this).data('width');
        });

        //set initial width
        $('.width-item', $('#widths')).first().trigger('click');
    },

    enableColorSelection: function(){
        $('.item', $('#palette')).on('click',function(event){
            $('.item', $('#palette')).removeClass('active');
            $(this).addClass('active');
            paper.color = $(event.target).data('color');
        });

        //set initial color
        $('.item', $('#palette')).first().trigger('click');
    },

    genereteOverlayList: function(){
        var overlays = ['everest.jpg', 'vangogh.jpg', 'monalisa.jpg', 'monet.jpg'];
        for (var i in overlays){
            $('#overlay-list').append(
                '<img src="images/overlay/' + overlays[i] + '" class="small-3 overlay-image-placeholder" />'
            );
        }
    },

    enableOverlaySelection: function(){
        $('.overlay-image-placeholder').on('click', function(){
            $('.overlay-image-placeholder').removeClass('active');
            $(this).addClass('active');
            state.overlay = $(this).attr('src');
        })
    },

    initPaperJs: function(){
        var canvas = document.getElementById('drawArea');
        paper.setup(canvas);
        paper.color = 'black';
        paper.strokeWidth = '1';

        var pencil = new Tool();
        var path;
        var draw_circle = true;

        pencil.onMouseDown = function(event) {
            path = new Path();
            path.strokeColor = paper.color;
            path.strokeWidth = paper.strokeWidth;

            path.add(event.point);
            draw_circle = true;
        };

        pencil.onMouseDrag = function(event) {
            path.add(event.point);

            draw_circle = false;
        };

        pencil.onMouseUp = function(event){
            if (draw_circle) {
                var dot_circle = new Path.Circle({
                    center: event.point,
                    radius: paper.strokeWidth/2
                });
                dot_circle.fillColor = paper.color;
                state.recent_path = dot_circle;
            }
            path.simplify();
            state.recent_path = path;

            //if namespace is set, send path as svg to namespace
            if (state.namespace) {
                if (draw_circle) {
                    path = dot_circle;
                }
                var path_svg = path.exportSVG(
                    {
                        asString: true,
                        precision: 5,
                        matchShapes: false
                    }
                );
                state.namespace.emit('path', path_svg);
                path.remove();
            }

        }
    },

    enableUndo: function(){
        $(window).keypress(function (event) {
            if (event.which == 117 && state.recent_path) { // 'u'
                if (!state.namespace) {

                    var matchingPath = paper.project.getItems({
                        segments: state.recent_path.segments
                    });

                    for (var i in matchingPath){
                        matchingPath[i].remove();
                    }

                    //state.recent_path.remove();
                    paper.view.update();
                }else{
                    var path_svg = state.recent_path.exportSVG(
                        {
                            asString: true,
                            precision: 5,
                            matchShapes: false
                        }
                    );
                    state.namespace.emit('delete', path_svg);
                }

                state.recent_path = '';
            }
        });
    },

    enableOverlayOnKeyPress: function() {
        var overlay;
        var overlayShown = false;

        $(window).keydown(function (event) {
            if (state.overlay) {
                if (event.which == 79 && !overlayShown) { // 'o'

                    if (state.overlay) {
                        $('#overlay').remove();
                        $('body').append(
                            '<img id="overlay" src="' + state.overlay + '" />'
                        );
                    }

                    overlay = new Raster('overlay');
                    overlay.position = paper.view.center;
                    overlay.opacity = 0.8;
                    paper.view.update();

                    overlayShown = true;
                    event.preventDefault();
                }
            }

        });



        $(window).keyup(function (event) {
            if (event.which == 79 && overlay){
                overlay.remove();
                paper.view.update();

                overlayShown = false;
                event.preventDefault();
            }

        });


    },

    enablePermanentOverlay: function() {
        var overlay;
        var overlayShown = false;

        $(window).keydown(function (event) {
            if (state.overlay) {
                if (event.which == 80 && !overlayShown) { // 'p'

                    if (state.overlay) {
                        $('#overlay').remove();
                        $('body').append(
                            '<img id="overlay" src="' + state.overlay + '" />'
                        );
                    }

                    overlay = new Raster('overlay');
                    overlay.position = paper.view.center;
                    overlay.opacity = 0.4;
                    paper.view.update();

                    overlayShown = true;
                    event.preventDefault();
                }
                else if (event.which == 80 && overlayShown) { // 'p'

                    overlay.remove();
                    paper.view.update();

                    overlayShown = false;
                    event.preventDefault();
                }
            }

        });

    },


    initGetCodeButton: function(){
        $('#get-code-button').on('click', function(){
            websocket.initiatewebsocket();
        });
    },

    initJoinButton: function(){
        $('#join-button').on('click', function(){
            websocket.joinAFriend();
        })
    }


};

var websocket = {
    initiatewebsocket: function(){
        var name = $('input[name=creator_name]').val();
        var socket = io.connect(socket_uri);
        socket.on('send_me_id', function () {
            state.unique_id = Math.random().toString(36).substr(2, 5);
            websocket.showUniqueId();
            socket.emit('my_id', state.unique_id);
        });


        //public socket
        socket.on('join_namespace', function () {
            state.namespace = io.connect(socket_uri + state.unique_id);
            state.namespace.emit('new_doodler', name);
            websocket.showDoodlers([name]);

            websocket.addListenersToNamespacedSocket();
        });

    },

    showUniqueId: function(){
        $('.lead', $('#invite-friend')).show().html(state.unique_id);
    },

    joinAFriend: function(){
        var name = $('input[name=dooler_name]').val();
        var code = $('input[name=code]').val();

        state.namespace = io.connect(socket_uri + code);

        //register as a new doodler
        state.namespace.emit('new_doodler', name);

        //ask for initial svg
        state.namespace.emit('get_initial_svg');

        //ask for overlay image
        state.namespace.emit('get_overlay_img');

        websocket.addListenersToNamespacedSocket();
    },

    showDoodlers: function(data){
        $('#doodlers').html('');
        for (var i = 0; i<data.length; i++){
            $("#doodlers-list").show();
            $('#doodlers').append('<span class="label">' + data[i] + '</span> &nbsp;');
        }
    },

    addListenersToNamespacedSocket: function(){

        //list all doodlers
        state.namespace.on('all_doodlers',function(data){
            websocket.showDoodlers(data);
        });

        //send initial svg
        state.namespace.on('get_initial_svg', function(){
            state.namespace.emit('initial_svg', paper.project.exportSVG(
                    {
                        asString: true,
                        precision: 5,
                        matchShapes: false
                    }
                )
            );
        });

        //on receiving initial svg, use it as starting svg
        state.namespace.on('initial_svg', function(data){
            paper.project.clear();
            paper.project.importSVG(data);
        });


        //send overlay image
        state.namespace.on('get_overlay_img', function(){
            state.namespace.emit('overlay_img', state.overlay);
        });

        //on receiving overlay image, use it as the overlay image
        state.namespace.on('overlay_img', function(data){
            state.overlay = data;
        });


        //on receiving a path, add it to the canvas
        state.namespace.on('path', function(data){
            var received_path = new Path();
            received_path.importSVG(data);

            paper.view.update();
        });

        //on receiving a delete, find a matching path and delete it
        state.namespace.on('delete', function(data){
            var received_path = paper.project.importSVG(data);

            var matchingPath = paper.project.getItems({
                segments: received_path.segments
            });

            for (var i in matchingPath){
                matchingPath[i].remove();
            }
            paper.view.update();

        });

    }

};

//start onload functions
$(function(){
    for (var key in onLoadFunctions) {
        if (onLoadFunctions.hasOwnProperty(key)) {
            onLoadFunctions[key]();
        }
    }

});
