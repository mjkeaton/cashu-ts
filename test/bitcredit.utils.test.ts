import {
	blindMessage,
	constructProofFromPromise,
	serializeProof
} from '@cashu/crypto/modules/client';
import { Keys, Proof } from '../src/model/types/index.js';
import * as utils from '../src/utils.js';
import { PUBKEYS } from './consts.js';
import { createDLEQProof } from '@cashu/crypto/modules/mint/NUT12';
import { hasValidDleq, hexToNumber, numberToHexPadded64 } from '../src/utils.js';
import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import { createBlindSignature, getPubKeyFromPrivKey } from '@cashu/crypto/modules/mint';
import { pointFromBytes } from '@cashu/crypto/modules/common';

const keys: Keys = {};
for (let i = 1; i <= 2048; i *= 2) {
	keys[i] = 'deadbeef';
}

const keys_base10: Keys = {};
for (let i = 1; i <= 10000; i *= 10) {
	keys_base10[i] = 'deadbeef';
}

const keys_base16: Keys = {};
for (let i = 1; i <= 0x10000; i *= 16) {
	keys_base16[i] = 'deadbeef';
}

describe('test decode token', () => {
  test('decode bitcredit token', async () => {
    const token = 'bitcrAeyJ0b2tlbiI6W3sibWludCI6Imh0dHA6Ly8xMjcuMC4wLjE6MzMzOCIsInByb29mcyI6W3siYW1vdW50Ijo4LCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjUxNDRkMjJlNmM3MzBhZmFjNWVhMTViMzJkMTY5NGQ0ODg4NTY5YzdjZWFlYWU4ZTA5ODQ4ZWFlOWE4MTI2ZGYiLCJDIjoiMDI4NGVjOWI3ZDIxNmUxYTM0ZmUwMGUyNmI3YzhmNDc3Mjk1OTkyN2VmMTMzOTZiNWQ0YTMyMmMyYmVmN2M3YzU4In0seyJhbW91bnQiOjMyLCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjE4ZDdmYjNkNTBhZWQwZjk5ODQxNDNlODE3N2ZkZDU1NjM1ZDNmYmUzOTQ4Y2FhYzY4NzEzMGJmMDAxZWRlZDQiLCJDIjoiMDI0NzEyMGYzZGMwMmM0MmZlYzU1ZGU1ZTU1ZTVmZGM2N2NiZjk5OGEzMmFlNWY3Mjg5ZDZhNWE0NjFmMDM3YjgxIn0seyJhbW91bnQiOjY0LCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjFmOWZkMDNlYjM1NTQ1MjYxYzEyZTM2MDlkNmE3NDUxYmE1MjNkOTJjNjA5MzU1NWQ4MjVjNTNjNzA0MTZlMGUiLCJDIjoiMDJjN2Y1MmM3NDA4ZjllOTI1MzczMzc5ZTIzYTJmODg3ZjY5MDFlYTg4YTZlYjYzZjkyODE5ODFlYjNmYjc3MGRmIn0seyJhbW91bnQiOjEyOCwiaWQiOiIwMGE2YzRmN2VmOTcxYjNmYTc3YjM3NTg5NThkMzljYmFjYTliMTBlZTdmM2YyOWJmNWFiMTQyMzA4YjEyOGFjZjciLCJzZWNyZXQiOiIyNjE3MzQ4ZDE3ZDAxZDk3NzkyZWVhZGRjYjI1MTZkNDE2YjNkNDM1MGQxYTQ4MTEyMThiMGYzMjU1NTEwMDc3IiwiQyI6IjAyOTFiZGMyOTEyMjc2ODA3NTlmZDA1NmNmYmRjODcwYjk4MGU1NzA5NDc1ZjBiMzg3MjUwODAwYzM3MTA3YTYwNCJ9LHsiYW1vdW50IjoyNTYsImlkIjoiMDBhNmM0ZjdlZjk3MWIzZmE3N2IzNzU4OTU4ZDM5Y2JhY2E5YjEwZWU3ZjNmMjliZjVhYjE0MjMwOGIxMjhhY2Y3Iiwic2VjcmV0IjoiMmVkYWJjZDQ4NGNmOGIyNDY4MjJjOGJhOGYxNTM4ZmY1MjJlYjA3Y2EzMDllYTNiMDM1ZmE5ZDQ2MzY0YzQ1OCIsIkMiOiIwMmRjNzE1ZWZjMGI4YzhlYzZmN2IzNzZlM2FjZjI4YTBmNTYxN2MxMGNhYmY4YjAyZTdkNzBjMTMzNTQ3NTM3YTgifSx7ImFtb3VudCI6NTEyLCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjVkMzk5MWE0YWE1Mjc3OWRiZjU1MzM4NTVhNGQ1MjY2NTcyZWM4NjEyYzRlYjQ5OGYwNDA3NDExNDRhMjM3YTciLCJDIjoiMDM1OTgyZGZhM2JmNGM5Y2Q1YTViZjExMzRlYWFmYWJmZGRjNjg2NmFkNDgwNmNlZDkxNzJiYjM4NmYxYmU5MGIxIn1dfV0sInVuaXQiOiJjcnNhdCJ9'
  
    const result = utils.getDecodedToken(token);
    expect(result).toStrictEqual({
        "mint": "http://127.0.0.1:3338",
        "proofs": [
          {
            "amount": 8,
            "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
            "secret": "5144d22e6c730afac5ea15b32d1694d4888569c7ceaeae8e09848eae9a8126df",
            "C": "0284ec9b7d216e1a34fe00e26b7c8f4772959927ef13396b5d4a322c2bef7c7c58"
          },
          {
            "amount": 32,
            "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
            "secret": "18d7fb3d50aed0f9984143e8177fdd55635d3fbe3948caac687130bf001eded4",
            "C": "0247120f3dc02c42fec55de5e55e5fdc67cbf998a32ae5f7289d6a5a461f037b81"
          },
          {
            "amount": 64,
            "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
            "secret": "1f9fd03eb35545261c12e3609d6a7451ba523d92c6093555d825c53c70416e0e",
            "C": "02c7f52c7408f9e925373379e23a2f887f6901ea88a6eb63f9281981eb3fb770df"
          },
          {
            "amount": 128,
            "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
            "secret": "2617348d17d01d97792eeaddcb2516d416b3d4350d1a4811218b0f3255510077",
            "C": "0291bdc291227680759fd056cfbdc870b980e5709475f0b387250800c37107a604"
          },
          {
            "amount": 256,
            "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
            "secret": "2edabcd484cf8b246822c8ba8f1538ff522eb07ca309ea3b035fa9d46364c458",
            "C": "02dc715efc0b8c8ec6f7b376e3acf28a0f5617c10cabf8b02e7d70c133547537a8"
          },
          {
            "amount": 512,
            "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
            "secret": "5d3991a4aa52779dbf5533855a4d5266572ec8612c4eb498f040741144a237a7",
            "C": "035982dfa3bf4c9cd5a5bf1134eaafabfddc6866ad4806ced9172bb386f1be90b1"
          }
        ],
        "unit": "crsat"
    });
  });

	test('encode bitcredit token', async () => {
		const obj = {
      "mint": "http://127.0.0.1:3338",
      "proofs": [
        {
          "amount": 8,
          "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
          "secret": "5144d22e6c730afac5ea15b32d1694d4888569c7ceaeae8e09848eae9a8126df",
          "C": "0284ec9b7d216e1a34fe00e26b7c8f4772959927ef13396b5d4a322c2bef7c7c58"
        },
        {
          "amount": 32,
          "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
          "secret": "18d7fb3d50aed0f9984143e8177fdd55635d3fbe3948caac687130bf001eded4",
          "C": "0247120f3dc02c42fec55de5e55e5fdc67cbf998a32ae5f7289d6a5a461f037b81"
        },
        {
          "amount": 64,
          "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
          "secret": "1f9fd03eb35545261c12e3609d6a7451ba523d92c6093555d825c53c70416e0e",
          "C": "02c7f52c7408f9e925373379e23a2f887f6901ea88a6eb63f9281981eb3fb770df"
        },
        {
          "amount": 128,
          "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
          "secret": "2617348d17d01d97792eeaddcb2516d416b3d4350d1a4811218b0f3255510077",
          "C": "0291bdc291227680759fd056cfbdc870b980e5709475f0b387250800c37107a604"
        },
        {
          "amount": 256,
          "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
          "secret": "2edabcd484cf8b246822c8ba8f1538ff522eb07ca309ea3b035fa9d46364c458",
          "C": "02dc715efc0b8c8ec6f7b376e3acf28a0f5617c10cabf8b02e7d70c133547537a8"
        },
        {
          "amount": 512,
          "id": "00a6c4f7ef971b3fa77b3758958d39cbaca9b10ee7f3f29bf5ab142308b128acf7",
          "secret": "5d3991a4aa52779dbf5533855a4d5266572ec8612c4eb498f040741144a237a7",
          "C": "035982dfa3bf4c9cd5a5bf1134eaafabfddc6866ad4806ced9172bb386f1be90b1"
        }
      ],
      "unit": "crsat"
  };

		const token = utils.getEncodedBitcreditTokenV3(obj);
		expect(token).toStrictEqual('bitcrAeyJ0b2tlbiI6W3sibWludCI6Imh0dHA6Ly8xMjcuMC4wLjE6MzMzOCIsInByb29mcyI6W3siYW1vdW50Ijo4LCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjUxNDRkMjJlNmM3MzBhZmFjNWVhMTViMzJkMTY5NGQ0ODg4NTY5YzdjZWFlYWU4ZTA5ODQ4ZWFlOWE4MTI2ZGYiLCJDIjoiMDI4NGVjOWI3ZDIxNmUxYTM0ZmUwMGUyNmI3YzhmNDc3Mjk1OTkyN2VmMTMzOTZiNWQ0YTMyMmMyYmVmN2M3YzU4In0seyJhbW91bnQiOjMyLCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjE4ZDdmYjNkNTBhZWQwZjk5ODQxNDNlODE3N2ZkZDU1NjM1ZDNmYmUzOTQ4Y2FhYzY4NzEzMGJmMDAxZWRlZDQiLCJDIjoiMDI0NzEyMGYzZGMwMmM0MmZlYzU1ZGU1ZTU1ZTVmZGM2N2NiZjk5OGEzMmFlNWY3Mjg5ZDZhNWE0NjFmMDM3YjgxIn0seyJhbW91bnQiOjY0LCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjFmOWZkMDNlYjM1NTQ1MjYxYzEyZTM2MDlkNmE3NDUxYmE1MjNkOTJjNjA5MzU1NWQ4MjVjNTNjNzA0MTZlMGUiLCJDIjoiMDJjN2Y1MmM3NDA4ZjllOTI1MzczMzc5ZTIzYTJmODg3ZjY5MDFlYTg4YTZlYjYzZjkyODE5ODFlYjNmYjc3MGRmIn0seyJhbW91bnQiOjEyOCwiaWQiOiIwMGE2YzRmN2VmOTcxYjNmYTc3YjM3NTg5NThkMzljYmFjYTliMTBlZTdmM2YyOWJmNWFiMTQyMzA4YjEyOGFjZjciLCJzZWNyZXQiOiIyNjE3MzQ4ZDE3ZDAxZDk3NzkyZWVhZGRjYjI1MTZkNDE2YjNkNDM1MGQxYTQ4MTEyMThiMGYzMjU1NTEwMDc3IiwiQyI6IjAyOTFiZGMyOTEyMjc2ODA3NTlmZDA1NmNmYmRjODcwYjk4MGU1NzA5NDc1ZjBiMzg3MjUwODAwYzM3MTA3YTYwNCJ9LHsiYW1vdW50IjoyNTYsImlkIjoiMDBhNmM0ZjdlZjk3MWIzZmE3N2IzNzU4OTU4ZDM5Y2JhY2E5YjEwZWU3ZjNmMjliZjVhYjE0MjMwOGIxMjhhY2Y3Iiwic2VjcmV0IjoiMmVkYWJjZDQ4NGNmOGIyNDY4MjJjOGJhOGYxNTM4ZmY1MjJlYjA3Y2EzMDllYTNiMDM1ZmE5ZDQ2MzY0YzQ1OCIsIkMiOiIwMmRjNzE1ZWZjMGI4YzhlYzZmN2IzNzZlM2FjZjI4YTBmNTYxN2MxMGNhYmY4YjAyZTdkNzBjMTMzNTQ3NTM3YTgifSx7ImFtb3VudCI6NTEyLCJpZCI6IjAwYTZjNGY3ZWY5NzFiM2ZhNzdiMzc1ODk1OGQzOWNiYWNhOWIxMGVlN2YzZjI5YmY1YWIxNDIzMDhiMTI4YWNmNyIsInNlY3JldCI6IjVkMzk5MWE0YWE1Mjc3OWRiZjU1MzM4NTVhNGQ1MjY2NTcyZWM4NjEyYzRlYjQ5OGYwNDA3NDExNDRhMjM3YTciLCJDIjoiMDM1OTgyZGZhM2JmNGM5Y2Q1YTViZjExMzRlYWFmYWJmZGRjNjg2NmFkNDgwNmNlZDkxNzJiYjM4NmYxYmU5MGIxIn1dfV0sInVuaXQiOiJjcnNhdCJ9');
	});
});
