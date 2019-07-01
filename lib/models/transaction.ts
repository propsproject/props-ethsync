export default class Transaction {
  get blockNumber(): string {
    return this._blockNumber;
  }

  get timeStamp(): string {
    return this._timeStamp;
  }

  get hash(): string {
    return this._hash;
  }

  get nonce(): string {
    return this._nonce;
  }

  get blockHash(): string {
    return this._blockHash;
  }

  get from(): string {
    return this._from;
  }

  get to(): string {
    return this._to;
  }

  get value(): string {
    return this._value;
  }

  get input(): string {
    return this._input;
  }

  get confirmation(): string {
    return this._confirmation;
  }

  constructor(obj: any) {
    this._blockNumber = obj.blockNumber;
    this._timeStamp = obj.timeStamp;
    this._hash = obj.hash;
    this._nonce = obj.nonce;
    this._blockHash = obj.blockHash;
    this._from = obj.from;
    this._to = obj.to;
    this._value = obj.value;
    this._input = obj.input;
    this._confirmation = obj.confirmation;
  }

  private readonly _blockNumber: string;
  private readonly _timeStamp: string;
  private readonly _hash: string; // txhash
  private readonly _nonce: string;
  private readonly _blockHash: string;
  private readonly _from: string;
  private readonly _to: string;
  private readonly _value: string;
  private readonly _input: string;
  private readonly _confirmation: string;
}
