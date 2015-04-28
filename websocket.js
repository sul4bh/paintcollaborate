var globalData = {};
var websocket  = {

    init: function(server){
        var io = require('socket.io')(server);

        //handle initial connection
        io.on('connection', function (socket) {
            socket.emit('send_me_id');
            socket.on('my_id', function (data) {

                //setup a namespace based on unique id sent by client
                var namespace = io
                    .of('/' + data)
                    .on('connection', function(socket) {

                        socket.on('new_doodler', function(name){
                            websocket.createNameSpaceDictionary(namespace, socket, name);
                            namespace.emit('all_doodlers', websocket.getAllDoodlers(namespace));

                        });

                        //forward initial svg request to doodle leader
                        socket.on('get_initial_svg', function(){
                            globalData[namespace.name]['leader'].emit('get_initial_svg');
                        });

                        //on receiving initial svg from leader, forward to everybody on the namespace
                        socket.on('initial_svg', function(data){
                            namespace.emit('initial_svg', data);
                        });


                        //forward initial overlay request to doodle leader
                        socket.on('get_overlay_img', function(){
                            globalData[namespace.name]['leader'].emit('get_overlay_img');
                        });

                        //on receiving initial svg from leader, forward to everybody on the namespace
                        socket.on('overlay_img', function(data){
                            namespace.emit('overlay_img', data);
                        });



                        //forward path to everybody in a namespace
                        socket.on('path', function(data){
                            namespace.emit('path', data);
                        });

                        //forward delete to everybody in a namespace
                        socket.on('delete', function(data){
                            namespace.emit('delete', data);
                        });

                        //clean up after disconnect
                        socket.on('disconnect', function(){

                            delete globalData[namespace.name]['nodes'][socket.id];

                            var nodes = globalData[namespace.name]['nodes'];
                            var nodes_keys = Object.keys(nodes);

                            if (nodes_keys.length == 0){
                                delete globalData[namespace.name];
                            }else{
                                //if leader disconnects, re-elect a new leader (the most recently connected node)
                                if (socket == globalData[namespace.name]['leader']){
                                    globalData[namespace.name]['leader'] = nodes[nodes_keys[nodes_keys.length - 1]].socket;
                                }
                                namespace.emit('all_doodlers', websocket.getAllDoodlers(namespace));
                            }
                        });
                    });




                //send a message to global namespace to connect to a newly created namespace
                socket.emit('join_namespace');
            });
        });


    },

    createNameSpaceDictionary: function(namespace, socket, name){
        if (Object.keys(globalData).indexOf(namespace.name) == -1) {
            globalData[namespace.name] = {
                overlay: '',
                leader: socket,
                nodes: {}
            };
        }

        globalData[namespace.name]['nodes'][socket.id] = {socket: socket, name: name};
    },

    getAllDoodlers: function(namespace){
        var all_doodlers = [];
        var keys = Object.keys(globalData[namespace.name]['nodes']);
        for (var socket_id in keys){
            all_doodlers.push(globalData[namespace.name]['nodes'][keys[socket_id]]['name']);
        }

        return all_doodlers;
    }


};


module.exports = websocket.init;