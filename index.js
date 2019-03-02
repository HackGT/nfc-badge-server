"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var WebSocket = require("ws");
var NFC = require("nfc-pcsc").NFC;
var nfc = new NFC();
var server = new WebSocket.Server({ port: 1337 });
function broadcast(data) {
    server.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
;
var ParserState;
(function (ParserState) {
    ParserState[ParserState["None"] = 0] = "None";
    ParserState[ParserState["NDEFInitial"] = 1] = "NDEFInitial";
    ParserState[ParserState["NDEFTypeLength"] = 2] = "NDEFTypeLength";
    ParserState[ParserState["NDEFPayloadLength"] = 3] = "NDEFPayloadLength";
    ParserState[ParserState["NDEFRecordType"] = 4] = "NDEFRecordType";
    ParserState[ParserState["NDEFData"] = 5] = "NDEFData";
})(ParserState || (ParserState = {}));
var WellKnownType;
(function (WellKnownType) {
    WellKnownType[WellKnownType["Unknown"] = 0] = "Unknown";
    WellKnownType[WellKnownType["Text"] = 1] = "Text";
    WellKnownType[WellKnownType["URI"] = 2] = "URI";
})(WellKnownType || (WellKnownType = {}));
var NDEFParser = /** @class */ (function () {
    function NDEFParser(buffer) {
        this.buffer = buffer;
        this.state = ParserState.None;
        this.ndefType = WellKnownType.Unknown;
        this.recordTypeLength = 1;
        this.initialDataByte = NaN;
        this.content = Buffer.alloc(0);
        this.contentIndex = 0;
        for (var i = 0; i < buffer.length; i++) {
            var byte = buffer[i];
            if (this.state === ParserState.None) {
                if (byte === 0x00) {
                    // NULL block, skip
                    i++;
                    continue;
                }
                if (byte === 0x03 && buffer.length > i + 2 && buffer[i + 2] === 0xD1) {
                    // NDEF message
                    // Skip length field for now
                    i++;
                    this.state = ParserState.NDEFInitial;
                    continue;
                }
            }
            else if (this.state === ParserState.NDEFInitial) {
                if ((byte & 1 << 0) !== 1) {
                    throw new Error("Only NFC Well Known Records are supported");
                }
                if ((byte & 1 << 4) === 0) {
                    throw new Error("Only short records supported currently");
                }
                if ((byte & 1 << 6) === 0) {
                    throw new Error("Message must be end message currently");
                }
                if ((byte & 1 << 7) === 0) {
                    throw new Error("Message must be beginning message currently");
                }
                this.state = ParserState.NDEFTypeLength;
            }
            else if (this.state === ParserState.NDEFTypeLength) {
                this.recordTypeLength = byte;
                this.state = ParserState.NDEFPayloadLength;
            }
            else if (this.state === ParserState.NDEFPayloadLength) {
                this.content = Buffer.alloc(byte);
                this.contentIndex = 0;
                this.state = ParserState.NDEFRecordType;
            }
            else if (this.state === ParserState.NDEFRecordType) {
                if (byte === 0x54) {
                    this.ndefType = WellKnownType.Text;
                }
                if (byte === 0x55) {
                    this.ndefType = WellKnownType.URI;
                }
                this.initialDataByte = NaN;
                this.state = ParserState.NDEFData;
            }
            else if (this.state === ParserState.NDEFData) {
                if (byte === 0xFE) {
                    this.state = ParserState.None;
                    continue;
                }
                this.content[this.contentIndex] = byte;
                this.contentIndex++;
            }
        }
    }
    NDEFParser.prototype.getURI = function () {
        if (this.content.length < 2 || this.ndefType !== WellKnownType.URI) {
            throw new Error("No URI found in parsed content");
        }
        return this.getProtocol(this.content[0]) + this.content.slice(1, this.content.length).toString("utf8");
    };
    NDEFParser.prototype.getText = function () {
        if (this.content.length < 4 || this.ndefType !== WellKnownType.Text) {
            throw new Error("No text content found on tag");
        }
        var languageCodeLength = this.content[0];
        return this.content.slice(1 + languageCodeLength, this.content.length).toString("utf8");
    };
    NDEFParser.prototype.getContent = function () {
        if (this.ndefType === WellKnownType.Text) {
            return this.getText();
        }
        else if (this.ndefType === WellKnownType.URI) {
            return this.getURI();
        }
        else {
            return "";
        }
    };
    NDEFParser.prototype.getProtocol = function (identifier) {
        switch (identifier) {
            case 0x00: return "";
            case 0x01: return "http://www.";
            case 0x02: return "https://www.";
            case 0x03: return "http://";
            case 0x04: return "https://";
            case 0x05: return "tel:";
            case 0x06: return "mailto:";
            case 0x07: return "ftp://anonymous:anonymous@";
            case 0x08: return "ftp://ftp.";
            case 0x09: return "ftps://";
            case 0x0A: return "sftp://";
            case 0x0B: return "smb://";
            case 0x0C: return "nfs://";
            case 0x0D: return "ftp://";
            case 0x0E: return "dav://";
            case 0x0F: return "news:";
            case 0x10: return "telnet://";
            case 0x11: return "imap:";
            case 0x12: return "rtsp://";
            case 0x13: return "urn:";
            case 0x14: return "pop:";
            case 0x15: return "sip:";
            case 0x16: return "sips:";
            case 0x17: return "tftp:";
            case 0x18: return "btspp://";
            case 0x19: return "btl2cap://";
            case 0x1A: return "btgoep://";
            case 0x1B: return "tcpobex://";
            case 0x1C: return "irdaobex://";
            case 0x1D: return "file://";
            case 0x1E: return "urn: epc: id:";
            case 0x1F: return "urn: epc: tag:";
            case 0x20: return "urn: epc: pat:";
            case 0x21: return "urn: epc: raw:";
            case 0x22: return "urn: epc:";
            case 0x23: return "urn: nfc:";
        }
        return "";
    };
    return NDEFParser;
}());
nfc.on("reader", function (reader) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    return __generator(this, function (_a) {
        reader.aid = "F222222222";
        console.log(reader.reader.name);
        reader.on("card", function () { return __awaiter(_this, void 0, void 0, function () {
            var data, url, _a, match, id;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, reader.read(4, 70)];
                    case 1:
                        data = _b.sent();
                        url = new NDEFParser(data).getURI();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/];
                    case 3:
                        match = url.match(/^https:\/\/info.hack.gt\/?\?user=([a-f0-9\-]+)$/i);
                        if (!match) {
                            console.warn("Invalid URL: " + url);
                            return [2 /*return*/];
                        }
                        id = match[1];
                        console.log("[" + new Date().toUTCString() + "] Badge tapped: " + id);
                        broadcast({ "badgeID": id });
                        return [2 /*return*/];
                }
            });
        }); });
        reader.on("error", function (err) {
            console.error(err);
        });
        return [2 /*return*/];
    });
}); });
nfc.on("error", function (err) {
    console.error(err);
});
