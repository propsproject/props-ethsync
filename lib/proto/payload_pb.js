/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
goog.exportSymbol('proto.pending_props_pb.Method', null, global);
goog.exportSymbol('proto.pending_props_pb.Params', null, global);
goog.exportSymbol('proto.pending_props_pb.RPCRequest', null, global);

/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.pending_props_pb.Params = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.pending_props_pb.Params, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.pending_props_pb.Params.displayName = 'proto.pending_props_pb.Params';
}


if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.pending_props_pb.Params.prototype.toObject = function(opt_includeInstance) {
  return proto.pending_props_pb.Params.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.pending_props_pb.Params} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.pending_props_pb.Params.toObject = function(includeInstance, msg) {
  var f, obj = {
    data: (f = msg.getData()) && google_protobuf_any_pb.Any.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.pending_props_pb.Params}
 */
proto.pending_props_pb.Params.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.pending_props_pb.Params;
  return proto.pending_props_pb.Params.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.pending_props_pb.Params} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.pending_props_pb.Params}
 */
proto.pending_props_pb.Params.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new google_protobuf_any_pb.Any;
      reader.readMessage(value,google_protobuf_any_pb.Any.deserializeBinaryFromReader);
      msg.setData(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.pending_props_pb.Params.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.pending_props_pb.Params.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.pending_props_pb.Params} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.pending_props_pb.Params.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      google_protobuf_any_pb.Any.serializeBinaryToWriter
    );
  }
};


/**
 * optional google.protobuf.Any data = 1;
 * @return {?proto.google.protobuf.Any}
 */
proto.pending_props_pb.Params.prototype.getData = function() {
  return /** @type{?proto.google.protobuf.Any} */ (
    jspb.Message.getWrapperField(this, google_protobuf_any_pb.Any, 1));
};


/** @param {?proto.google.protobuf.Any|undefined} value */
proto.pending_props_pb.Params.prototype.setData = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


proto.pending_props_pb.Params.prototype.clearData = function() {
  this.setData(undefined);
};


/**
 * Returns whether this field is set.
 * @return {!boolean}
 */
proto.pending_props_pb.Params.prototype.hasData = function() {
  return jspb.Message.getField(this, 1) != null;
};



/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.pending_props_pb.RPCRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.pending_props_pb.RPCRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.pending_props_pb.RPCRequest.displayName = 'proto.pending_props_pb.RPCRequest';
}


if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.pending_props_pb.RPCRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.pending_props_pb.RPCRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.pending_props_pb.RPCRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.pending_props_pb.RPCRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    method: jspb.Message.getFieldWithDefault(msg, 1, 0),
    params: (f = msg.getParams()) && proto.pending_props_pb.Params.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.pending_props_pb.RPCRequest}
 */
proto.pending_props_pb.RPCRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.pending_props_pb.RPCRequest;
  return proto.pending_props_pb.RPCRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.pending_props_pb.RPCRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.pending_props_pb.RPCRequest}
 */
proto.pending_props_pb.RPCRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.pending_props_pb.Method} */ (reader.readEnum());
      msg.setMethod(value);
      break;
    case 2:
      var value = new proto.pending_props_pb.Params;
      reader.readMessage(value,proto.pending_props_pb.Params.deserializeBinaryFromReader);
      msg.setParams(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.pending_props_pb.RPCRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.pending_props_pb.RPCRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.pending_props_pb.RPCRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.pending_props_pb.RPCRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMethod();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getParams();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.pending_props_pb.Params.serializeBinaryToWriter
    );
  }
};


/**
 * optional Method method = 1;
 * @return {!proto.pending_props_pb.Method}
 */
proto.pending_props_pb.RPCRequest.prototype.getMethod = function() {
  return /** @type {!proto.pending_props_pb.Method} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {!proto.pending_props_pb.Method} value */
proto.pending_props_pb.RPCRequest.prototype.setMethod = function(value) {
  jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional Params params = 2;
 * @return {?proto.pending_props_pb.Params}
 */
proto.pending_props_pb.RPCRequest.prototype.getParams = function() {
  return /** @type{?proto.pending_props_pb.Params} */ (
    jspb.Message.getWrapperField(this, proto.pending_props_pb.Params, 2));
};


/** @param {?proto.pending_props_pb.Params|undefined} value */
proto.pending_props_pb.RPCRequest.prototype.setParams = function(value) {
  jspb.Message.setWrapperField(this, 2, value);
};


proto.pending_props_pb.RPCRequest.prototype.clearParams = function() {
  this.setParams(undefined);
};


/**
 * Returns whether this field is set.
 * @return {!boolean}
 */
proto.pending_props_pb.RPCRequest.prototype.hasParams = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * @enum {number}
 */
proto.pending_props_pb.Method = {
  ISSUE: 0,
  REVOKE: 1,
  SETTLE: 2
};

goog.object.extend(exports, proto.pending_props_pb);
