raptor.define(
    "jsdoc",
    function(raptor) {
        "use strict";
        
        var esprima = require('esprima'),
            strings = raptor.require('strings'),
            SymbolSet = raptor.require('jsdoc.SymbolSet'),
            Environment = raptor.require('jsdoc.Environment'),
            ASTWalker = raptor.require("jsdoc.ASTWalker"),
            Comment = raptor.require('jsdoc.Comment'),
            CommentParser = raptor.require('jsdoc.CommentParser'),
            attachComments = function(ast, commentParser) {
                if (!ast.comments) {
                    return;
                }
                
                var nodes = [];
                
                ast.comments.forEach(function(comment, i) {
                    if (comment.type === 'Block' && strings.startsWith(comment.value, '*')) {
                        var parsedComment =  commentParser.parse('/*' + comment.value + '*/');
                        parsedComment.range = comment.range;
                        nodes.push(parsedComment);
                        parsedComment.type = "JSDocComment";
                        ast.comments[i] = parsedComment;
                    }
                    else {
                        comment.type += "Comment";
                    }
                });
                
                var attachCommentsHelper = function(node) {
                    if (node == null) {
                        return;
                    }
                    
                    if (raptor.isArray(node)) {
                        node.forEach(attachCommentsHelper);
                    }
                    else if (typeof node === 'object') {
                        if (node.range) {
                            nodes.push(node);
                        }
                        
                        for (var key in node) {
                            if (node.hasOwnProperty(key)) {
                                if (key !== 'range') {
                                    attachCommentsHelper(node[key]);
                                }
                            }
                        }
                    }
                };

                attachCommentsHelper(ast);
                
                nodes.sort(function(a, b) {
                    a = a.range[0];
                    b = b.range[0];
                    return a < b ? -1 : (a > b ? 1 : 0);
                });
                
                for (var i=0, len=nodes.length, node, nextNode; i<len; i++) {
                    node = nodes[i];
                    if (node instanceof Comment) {
                        var start = -1;
                        var j=i+1;
                        
                        while (j<len) {
                            nextNode = nodes[j];
                            if (!(nextNode instanceof Comment)) {
                                nextNode.comment = node;
                                if (start === -1) {
                                    start = nextNode.range[0];
                                }
                                else if (nextNode.range[0] !== start) {
                                    break;
                                }
                            }
                            j++;
                        }
                    }
                }

                //console.error(nodes);
            };
        
        
        return {
            parse: function(source, env) {
                var File = raptor.require("files").File;
                
                var commentParser = new CommentParser(env);
                
                
                if (source instanceof File) {
                    source = source.readAsString("UTF-8");
                }
                
                if (this.logger().isDebugEnabled()) {
                    this.logger().debug("Parsing: " + source);    
                }
                
                var ast = esprima.parse(source, {comment: true, range: true, loc: true});
                attachComments(ast, commentParser);
                return ast;
            },
            
            createSymbols: function() {
                return new SymbolSet();
            },
            
            createEnvironment: function() {
                return new Environment();
            },
            
            loadSymbols: function(ast, env) {
                var File = raptor.require("files").File;
                
                if (!env) {
                    env  = this.createEnvironment();
                }
                
                if (typeof ast === 'string' || ast instanceof File) {
                    ast = this.parse(ast, env);
                }
                
                var walker = new ASTWalker(env);
                walker.walk(ast);
                return env.getSymbols();
            }
        };
    });