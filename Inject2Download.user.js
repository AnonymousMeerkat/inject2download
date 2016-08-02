// ==UserScript==
// @name         Inject2Download
// @namespace    http://lkubuntu.wordpress.com/
// @version      0.1
// @description  Simple media download script
// @author       Anonymous Meerkat
// @include      *
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    "use strict";

    // Helper functions
    function i2d_show_url(namespace, url, description) {
        function get_absolute_url(url) {
            var a = document.createElement('a');
            a.href = url;
            return a.href;
        }

        if (!description)
            description = "";

        if (typeof url !== "string" || url.replace("\s", "").length === 0)
            return;

        url = get_absolute_url(url);

        if (!("i2d_url_list" in window))
            window.i2d_url_list = [];

        for (var i = 0; i < i2d_url_list.length; i++) {
            if (i2d_url_list[i][0] === namespace &&
                i2d_url_list[i][1] === url &&
                i2d_url_list[i][2] === description)
                    return;
        }


        i2d_url_list.push([namespace, url, description]);

        var newurl = decodeURIComponent(url);

        var text = "[" + namespace + "] " + description + ": ";

        console.log("[i2d] " + text + newurl);

        var el = document.getElementById("i2d-popup");
        if (!el) {
            el = document.createElement("div");
            //el.style.position = "absolute";
            el.style.width = "max(60%, 100em)";
            el.style.height = "max(60%, 100em)";
            el.style.maxWidth = "100%";
            el.style.maxHeight = "100%";
            el.style.background = "white";
            el.style.top = "0px";
            el.style.left = "0px";
            el.style.zIndex = 999999;
            el.style.color = "black";
            el.style.overflow = "scroll";
            el.ondblclick = function() {
                el.parentElement.removeChild(el);
            };
            el.innerHTML = "Double click to close<br />";
            el.id = "i2d-popup";
            document.body.appendChild(el);
        }
        el.innerHTML += text + "<a href='" + newurl + "' style='color:blue'>" + newurl + "</a><br />";

        // XXX: why is this needed? test: http://playbb.me/embed.php?w=718&h=438&vid=at/nw/flying_witch_-_01.mp4, animeplus.tv
        document.body.removeChild(el);
        el.style.position = "absolute";
        document.body.appendChild(el);
    }


    // Injecting functions
    var get_script_str = function(f) {
        return f.toString().replace(/^function.*{|}$/g, '');
    };

    function add_script(s, el) {
        var script_body = "(function() {\n" + s + "\n})();";
        var myscript = document.createElement('script');
        myscript.className = "i2d";
        myscript.innerHTML = script_body;
        if (el) {
            el.appendChild(myscript);
        } else {
            document.head.appendChild(myscript);
        }
    }

    function inject(variable, newvalue, aliases) {
        console.log("[i2d] injecting " + variable);
        if (!aliases)
            aliases = [];

        add_script(i2d_show_url.toString() + "\n" +
                   "if (!(window." + variable + ".INJECTED)) {\n" +
                   "var oldvariable = window." + variable + ";\n" +
                   "var oldvariable_keys = Object.keys(oldvariable);\n" +
                   "window." + variable + " = " + newvalue.toString() + ";\n" +
                   "for (var i = 0; i < oldvariable_keys.length; i++) {\n" +
                   "    window." + variable + "[oldvariable_keys[i]] = oldvariable[oldvariable_keys[i]];\n" +
                   "}\n" +
                   "window." + variable + ".INJECTED = true;\n" +
                   "var aliases = " + JSON.stringify(aliases) + ";\n" +
                   "for (var i = 0; i < aliases.length; i++) {\n" +
                   "    if (aliases[i] in window && window[aliases[i]] == oldvariable)" +
                   "        window[aliases[i]] = window." + variable + "\n" +
                   "}\n" +
                   "}");
    }

    function inject_jquery_base() {
        console.log("[i2d] injecting jquery base function");
        add_script("window.i2d_jquery_plugins = {};");
        inject("jQuery", function() {
            var result = oldvariable.apply(this, arguments);

            var keys = Object.keys(i2d_jquery_plugins);
            for (var i = 0; i < keys.length; i++) {
                if (!(keys[i] in result))
                    continue;

                (function() {
                    var ourkey = keys[i];

                    var old_plugin = result[ourkey];
                    var old_plugin_keys = Object.keys(old_plugin);

                    result[ourkey] = function() {
                        return window.i2d_jquery_plugins[ourkey].call(this, old_plugin, arguments);
                    };

                    for (var x = 0; x < old_plugin_keys.length; x++) {
                        result[keys[i]][old_plugin_keys[x]] = old_plugin[old_plugin_keys[x]];
                    }
                })();
            }

            return result;
        }, ["$"]);
    }

    function inject_jquery_plugin(name, value) {
        console.log("[i2d] injecting jquery plugin " + name);

        add_script(i2d_show_url.toString() +
                   "if (!(" + JSON.stringify(name) + " in i2d_jquery_plugins)) {\n" +
                   "i2d_jquery_plugins[" + JSON.stringify(name) + "] = " + value.toString() + ";\n" +
                   "}");
    }


    // Main code
    function i2d_main(e) {
        if (e) {
            if (!e.tagName || e.tagName.toLowerCase() !== "script")
                return;
            if ((e.className === "i2d")) {
                return;
            }
        }

        if ("soundManager" in unsafeWindow && !unsafeWindow.soundManager.INJECTED) {
            inject("soundManager.createSound", function(arg1, arg2) {
                if (typeof arg1 === "string")
                    i2d_show_url("soundManager", arg2);
                else
                    i2d_show_url("soundManager", arg1.url);

                return oldvariable.apply(this, arguments);
            });
        }

        if ("jwplayer" in unsafeWindow && !unsafeWindow.jwplayer.INJECTED) {
            inject("jwplayer", function() {
                var result = oldvariable.apply(this, arguments);

                var check_sources = function(x) {
                    if (typeof x === "object") {
                        if ("length" in x) {
                            for (var i = 0; i < x.length; i++) {
                                check_sources(x[i]);
                            }
                            return;
                        }

                        var label = "";

                        if ("title" in x)
                            label += "[" + x.title + "]";

                        if ("label" in x)
                            label += "[" + x.label + "]";

                        if ("streamer" in x) {
                            i2d_show_url("jwplayer", x.streamer, "[stream]" + label);
                        }

                        if ("file" in x) {
                            i2d_show_url("jwplayer", x.file, label);
                        }

                        if ("sources" in x) {
                            for (var i = 0; i < x.sources.length; i++) {
                                check_sources(x.sources[i]);
                            }
                        }

                        if ("playlist" in x && x.playlist instanceof Array) {
                            for (var i = 0; i < x.playlist.length; i++) {
                                check_sources(x.playlist[i]);
                            }
                        }
                    } else if (typeof x === "string") {
                        i2d_show_url("jwplayer", x);
                    }
                };

                var old_jwplayer_setup = result.setup;
                result.setup = function() {
                    if (typeof arguments[0] === "object") {
                        var x = arguments[0];

                        if ("modes" in x) {
                            for (var i = 0; i < x.modes.length; i++) {
                                // TODO: support more?
                                if ("type" in x.modes[i] && x.modes[i].type === "html5") {
                                    if ("config" in x.modes[i] && "file" in x.modes[i].config) {
                                        check_sources(x.modes[i].config);
                                    }
                                }
                            }
                        }

                        check_sources(x);
                    }

                    return old_jwplayer_setup.apply(this, arguments);
                };

                var old_jwplayer_load = result.load;
                result.load = function() {
                    check_sources(arguments[0]);
                    return old_jwplayer_load.apply(this, arguments);
                };

                return result;
            });
        }

        if ("flowplayer" in unsafeWindow && !unsafeWindow.flowplayer.INJECTED) {
            inject("flowplayer", function() {
                if (arguments.length >= 3 && typeof arguments[2] === "object") {
                    if ("clip" in arguments[2] && "url" in arguments[2].clip) {
                        i2d_show_url("flowplayer", arguments[2].clip.url);
                    }
                    if ("playlist" in arguments[2] && arguments[2].playlist instanceof Array) {
                        for (var i = 0; i < arguments[2].playlist.length; i++) {
                            if ("url" in arguments[2].playlist[i]) {
                                var oururl = arguments[2].playlist[i].url;

                                if (!oururl.match(/\.xml$/))
                                    i2d_show_url("flowplayer", oururl);
                            }
                            if ("bitrates" in arguments[2].playlist[i]) {
                                var bitrates = arguments[2].playlist[i].bitrates;
                                for (var j = 0; j < bitrates.length; j++) {
                                    if ("url" in bitrates[j]) {
                                        var description = "";
                                        if (bitrates[j].isDefault)
                                            description += "default:";
                                        if (bitrates[j].sd)
                                            description += "sd:";
                                        if (bitrates[j].hd)
                                            description += "hd:";
                                        if (bitrates[j].bitrate)
                                            description += bitrates[j].bitrate;

                                        i2d_show_url("flowplayer", bitrates[j].url, description);
                                    }
                                }
                            }
                        }
                    }
                }

                var result = oldvariable.apply(this, arguments);

                if (!result)
                    return result;

                var old_fplayer_addclip = result.addClip;
                result.addClip = function() {
                    if (arguments.length > 0 && typeof arguments[0] === "object" && "url" in arguments[0])
                      i2d_show_url("flowplayer", arguments[0].url);

                    return old_fplayer_addclip.apply(this, arguments);
                };

                return result;
            });
            inject("$f", function() {return flowplayer.apply(this, arguments)});
        }

        if ("videojs" in unsafeWindow && !unsafeWindow.videojs.INJECTED) {
            inject("videojs", function() {
                if (arguments.length > 0 && typeof arguments[0] === "string") {
                    var my_el = document.getElementById(arguments[0]);
                    if (!my_el)
                        my_el = document.querySelector(arguments[0]);

                    if (my_el) {
                        if (my_el.src) {
                           i2d_show_url("videojs", my_el.src);
                        }

                        for (var i = 0; i < my_el.children.length; i++) {
                            if (my_el.children[i].tagName.toLowerCase() === "source") {
                                if (my_el.children[i].src) {
                                    i2d_show_url("videojs", my_el.children[i].src, my_el.children[i].getAttribute("label"));
                                }
                            }
                        }
                    }
                }

                var result = oldvariable.apply(this, arguments);

                var old_videojs_src = result.src;
                result.src = function() {
                    if (arguments.length > 0 && typeof arguments[0] === "object") {
                        if ("src" in arguments[0]) {
                            i2d_show_url("videojs", arguments[0].src);
                        }
                    }

                    return old_videojs_src.apply(this, arguments);
                };

                return result;
            });

            add_script(i2d_show_url.toString() +
                       get_script_str(function() {
                            document.addEventListener("DOMContentLoaded", function() {
                                var els = document.getElementsByClassName("video-js");
                                for (var i = 0; i < els.length; i++) {
                                    var my_el = els[i];
                                    if (my_el.tagName.toLowerCase() === "video") {
                                        if (!my_el.getAttribute('data-setup')) {
                                            continue;
                                        }
                                        if (my_el.src) {
                                           i2d_show_url("videojs", my_el.src);
                                        }

                                        for (var i = 0; i < my_el.children.length; i++) {
                                            if (my_el.children[i].tagName.toLowerCase() === "source") {
                                                if (my_el.children[i].src) {
                                                    i2d_show_url("videojs", my_el.children[i].src, my_el.children[i].getAttribute("label"));
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                       }));
        }

        if ("amp" in unsafeWindow && !unsafeWindow.amp.INJECTED) {
            inject("amp", function() {
                function show_amp_source(sourceobj) {
                    if ("protectionInfo" in sourceobj) {
                        console.log("[amp] Cannot decode protection info");
                    }
                    if ("src" in sourceobj)
                       i2d_show_url("amp", sourceobj.src);
                }

                if (arguments.length >= 2 && typeof arguments[1] === "object") {
                    if ("sourceList" in arguments[1]) {
                        for (var i = 0; i < arguments[1].sourceList.length; i++) {
                            show_amp_source(arguments[1].sourceList[i]);
                        }
                    }
                }

                var result = oldvariable.apply(this, arguments);

                if (!result)
                    return result;

                var old_amp_src = result.src;
                result.src = function() {
                    for (var i = 0; i < arguments[0].length; i++) {
                        show_amp_source(arguments[0][i]);
                    }

                    return old_amp_src.apply(this, arguments);
                };

                return result;
            });
        }

        if (window.location.host.search("forvo") >= 0 && "createAudioObject" in unsafeWindow && !unsafeWindow.createAudioObject.INJECTED) {
            inject("createAudioObject", function(id, mp3, ogg) {
                i2d_show_url("forvo", mp3, "mp3");
                i2d_show_url("forvo", ogg, "ogg");

                return oldvariable.apply(this, arguments);
            });
        }

        if ("jQuery" in unsafeWindow) {
            if (!unsafeWindow.jQuery.INJECTED) {
                inject_jquery_base();
            }

            if (unsafeWindow.jQuery.fn.jPlayer && !("jPlayer" in unsafeWindow.i2d_jquery_plugins)) {
                inject_jquery_plugin("jPlayer", function(orig, args) {
                    if (args.length > 0 && args[0] === "setMedia") {
                        if (args.length > 1) {
                            if (typeof args[1] === "object") {
                                for (var i in args[1]) {
                                    if (i === "title" ||
                                        i === "duration" ||
                                        i === "track" /* for now */ ||
                                        i === "artist" ||
                                        i === "free")
                                        continue;

                                    i2d_show_url("jPlayer", args[1][i], i);
                                }
                            } else if (typeof args[1] === "string") {
                                i2d_show_url("jPlayer", args[1]);
                            }
                        }
                    }

                    return orig.apply(this, args);
                })
            }
        }
    }

    i2d_main();

    window.addEventListener("afterscriptexecute", function(e) {
      i2d_main(e.target);
    });

    document.addEventListener("DOMContentLoaded", function() {
        var get_raws = function() {
            var audios = [].slice.call(document.getElementsByTagName("audio"));
            var videos = [].slice.call(document.getElementsByTagName("video"));
            var els = Array.concat(audios, videos);

            for (var i = 0; i < els.length; i++) {
                var basename = "raw ";
                var el = els[i];

                if (el.tagName.toLowerCase() === "video") {
                    basename += "video";
                } else {
                    basename += "audio";
                }

                if (el.id)
                    basename += ": #" + el.id;

                var show_updates = function() {
                    if (el.src)
                        i2d_show_url(basename, el.src);

                    for (var x = 0; x < el.children.length; x++) {
                        if (els[i].children[x].tagName.toLowerCase() !== "source") {
                            continue;
                        }

                        var type = null;
                        if (el.children[x].type)
                            type = el.children[x].type;

                        if (el.children[x].src)
                            i2d_show_url(basename, el.children[x].src, type);
                    }
                };

                var observer = new MutationObserver(show_updates);
                observer.observe(el, { attributes: true, childList: true });

                show_updates();
            }
        };
        add_script(i2d_show_url.toString() + "\n" +
                  "(" + get_raws.toString() + ")();");
    });
})();
