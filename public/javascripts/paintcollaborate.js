var socket_uri = 'http://localhost:3000';

paper.install(window);

var state = {
    unique_id: '',
    namespace: ''
};

var onLoadFunctions = {
    generatePalette: function(){
        //#https://github.com/mrmrs/colors
        var colors = {
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
            white: "#fff",
            black: "#111"
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

    enableColorSelection: function(){
        $('.item', $('#palette')).on('click',function(event){
            $('.item', $('#palette')).removeClass('active');
            $(this).addClass('active');
            paper.color = $(event.target).data('color');
        });
    },

    initPaperJs: function(){
        var canvas = document.getElementById('drawArea');
        paper.setup(canvas);
        paper.color = 'black';

        var pencil = new Tool();
        var path;
        var draw_circle = true;

        pencil.onMouseDown = function(event) {
            path = new Path();
            path.strokeColor = paper.color;
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
                    radius: 0.25
                });
                dot_circle.strokeColor = paper.color;
            }
            path.smooth();


            //if path is set, send path as svg to namespace
            if (state.namespace) {
                var path_svg = path.exportSVG(
                    {
                        asString: true,
                        precision: 5,
                        matchShapes: false
                    }
                );
                state.namespace.emit('path', path_svg);
                path.removeSegments();
            }


        }
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
        var socket = io.connect('http://localhost:3000');
        socket.on('send_me_id', function () {
            state.unique_id = Math.random().toString(36).slice(6);
            websocket.showUniqueId();
            socket.emit('my_id', state.unique_id);
        });


        //public socket
        socket.on('join_namespace', function () {
            state.namespace = io.connect('http://localhost:3000/' + state.unique_id);
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

        state.namespace = io.connect('http://localhost:3000/' + code);

        //register as a new doodler
        state.namespace.emit('new_doodler', name);

        //ask for initial svg
        state.namespace.emit('get_initial_svg');

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

        //on receiving a path, add it to the canvas
        state.namespace.on('path', function(data){
            var received_path = new Path();
            received_path.importSVG(data);
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
