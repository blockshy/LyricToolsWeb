

// Keys and S-Boxes ported from the provided Java implementation

const KEY_1_STR = "!@#)(NHLiuy*$%^&";
const KEY_2_STR = "123ZXC!@#)(*$%^&";
const KEY_3_STR = "!@#)(*$%^&abcDEF";

const XOR_KEY_HEX = "629F5B0900C35E95239F13117ED8923FBC90BB740EC347743D90AA3F51D8F411849FDE951DC3C609D59FFA66F9D8F0F7A090A1D6F3C3F3D6A190A0F7F0D8F966FA9FD509C6C31D95DE9F8411F4D8513FAA903D7447C30E74BB90BC3F92D87E11139F23955EC300095B9F6266A1D852F76790CAD64AC34AD6CA9067F752D8A166";

const SBOXES = [
  // S1
  [
    14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7,
    0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
    4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0,
    15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13
  ],
  // S2
  [
    15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10,
    3, 13, 4, 7, 15, 2, 8, 15, 12, 0, 1, 10, 6, 9, 11, 5,
    0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15,
    13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9
  ],
  // S3
  [
    10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8,
    13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1,
    13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7,
    1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12
  ],
  // S4
  [
    7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15,
    13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9,
    10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4,
    3, 15, 0, 6, 10, 10, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14
  ],
  // S5
  [
    2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9,
    14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6,
    4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14,
    11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3
  ],
  // S6
  [
    12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11,
    10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8,
    9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6,
    4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13
  ],
  // S7
  [
    4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1,
    13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6,
    1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2,
    6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12
  ],
  // S8
  [
    13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7,
    1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2,
    7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8,
    2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11
  ]
];

// Helper functions for Bit manipulation
function extractBitFromBytes(dataBytes: Uint8Array, bitPosition: number, shiftAmount: number): number {
  const byteIndex = Math.floor(bitPosition / 32) * 4 + 3 - Math.floor((bitPosition % 32) / 8);
  const bitInByte = 7 - (bitPosition % 8);
  return ((dataBytes[byteIndex] >> bitInByte) & 0x01) << shiftAmount;
}

function extractBitFromInt(dataInt: number, bitPosition: number, shiftAmount: number): number {
  return ((dataInt >>> (31 - bitPosition)) & 0x00000001) << shiftAmount;
}

function extractBitLeftShift(dataInt: number, bitPosition: number, shiftAmount: number): number {
  // Using unsigned right shift >>> to safely handle 32-bit signed int overflow issues in JS
  return ((dataInt << bitPosition) & 0x80000000) >>> shiftAmount;
}

function prepareSboxIndex(inputByte: number): number {
  return (inputByte & 0x20) | ((inputByte & 0x1f) >> 1) | ((inputByte & 0x01) << 4);
}

// DES Core Implementation
class DES {
  static ENCRYPT_MODE = 1;
  static DECRYPT_MODE = 0;

  static initialPermutation(state: Int32Array, inputData: Uint8Array) {
    // High 32 bits
    state[0] = (
      extractBitFromBytes(inputData, 57, 31) | extractBitFromBytes(inputData, 49, 30) |
      extractBitFromBytes(inputData, 41, 29) | extractBitFromBytes(inputData, 33, 28) |
      extractBitFromBytes(inputData, 25, 27) | extractBitFromBytes(inputData, 17, 26) |
      extractBitFromBytes(inputData, 9, 25) | extractBitFromBytes(inputData, 1, 24) |
      extractBitFromBytes(inputData, 59, 23) | extractBitFromBytes(inputData, 51, 22) |
      extractBitFromBytes(inputData, 43, 21) | extractBitFromBytes(inputData, 35, 20) |
      extractBitFromBytes(inputData, 27, 19) | extractBitFromBytes(inputData, 19, 18) |
      extractBitFromBytes(inputData, 11, 17) | extractBitFromBytes(inputData, 3, 16) |
      extractBitFromBytes(inputData, 61, 15) | extractBitFromBytes(inputData, 53, 14) |
      extractBitFromBytes(inputData, 45, 13) | extractBitFromBytes(inputData, 37, 12) |
      extractBitFromBytes(inputData, 29, 11) | extractBitFromBytes(inputData, 21, 10) |
      extractBitFromBytes(inputData, 13, 9) | extractBitFromBytes(inputData, 5, 8) |
      extractBitFromBytes(inputData, 63, 7) | extractBitFromBytes(inputData, 55, 6) |
      extractBitFromBytes(inputData, 47, 5) | extractBitFromBytes(inputData, 39, 4) |
      extractBitFromBytes(inputData, 31, 3) | extractBitFromBytes(inputData, 23, 2) |
      extractBitFromBytes(inputData, 15, 1) | extractBitFromBytes(inputData, 7, 0)
    );

    // Low 32 bits
    state[1] = (
      extractBitFromBytes(inputData, 56, 31) | extractBitFromBytes(inputData, 48, 30) |
      extractBitFromBytes(inputData, 40, 29) | extractBitFromBytes(inputData, 32, 28) |
      extractBitFromBytes(inputData, 24, 27) | extractBitFromBytes(inputData, 16, 26) |
      extractBitFromBytes(inputData, 8, 25) | extractBitFromBytes(inputData, 0, 24) |
      extractBitFromBytes(inputData, 58, 23) | extractBitFromBytes(inputData, 50, 22) |
      extractBitFromBytes(inputData, 42, 21) | extractBitFromBytes(inputData, 34, 20) |
      extractBitFromBytes(inputData, 26, 19) | extractBitFromBytes(inputData, 18, 18) |
      extractBitFromBytes(inputData, 10, 17) | extractBitFromBytes(inputData, 2, 16) |
      extractBitFromBytes(inputData, 60, 15) | extractBitFromBytes(inputData, 52, 14) |
      extractBitFromBytes(inputData, 44, 13) | extractBitFromBytes(inputData, 36, 12) |
      extractBitFromBytes(inputData, 28, 11) | extractBitFromBytes(inputData, 20, 10) |
      extractBitFromBytes(inputData, 12, 9) | extractBitFromBytes(inputData, 4, 8) |
      extractBitFromBytes(inputData, 62, 7) | extractBitFromBytes(inputData, 54, 6) |
      extractBitFromBytes(inputData, 46, 5) | extractBitFromBytes(inputData, 38, 4) |
      extractBitFromBytes(inputData, 30, 3) | extractBitFromBytes(inputData, 22, 2) |
      extractBitFromBytes(inputData, 14, 1) | extractBitFromBytes(inputData, 6, 0)
    );
  }

  static inversePermutation(state: Int32Array, output: Uint8Array) {
    output[3] = (
      extractBitFromInt(state[1], 7, 7) | extractBitFromInt(state[0], 7, 6) |
      extractBitFromInt(state[1], 15, 5) | extractBitFromInt(state[0], 15, 4) |
      extractBitFromInt(state[1], 23, 3) | extractBitFromInt(state[0], 23, 2) |
      extractBitFromInt(state[1], 31, 1) | extractBitFromInt(state[0], 31, 0)
    );
    output[2] = (
      extractBitFromInt(state[1], 6, 7) | extractBitFromInt(state[0], 6, 6) |
      extractBitFromInt(state[1], 14, 5) | extractBitFromInt(state[0], 14, 4) |
      extractBitFromInt(state[1], 22, 3) | extractBitFromInt(state[0], 22, 2) |
      extractBitFromInt(state[1], 30, 1) | extractBitFromInt(state[0], 30, 0)
    );
    output[1] = (
      extractBitFromInt(state[1], 5, 7) | extractBitFromInt(state[0], 5, 6) |
      extractBitFromInt(state[1], 13, 5) | extractBitFromInt(state[0], 13, 4) |
      extractBitFromInt(state[1], 21, 3) | extractBitFromInt(state[0], 21, 2) |
      extractBitFromInt(state[1], 29, 1) | extractBitFromInt(state[0], 29, 0)
    );
    output[0] = (
      extractBitFromInt(state[1], 4, 7) | extractBitFromInt(state[0], 4, 6) |
      extractBitFromInt(state[1], 12, 5) | extractBitFromInt(state[0], 12, 4) |
      extractBitFromInt(state[1], 20, 3) | extractBitFromInt(state[0], 20, 2) |
      extractBitFromInt(state[1], 28, 1) | extractBitFromInt(state[0], 28, 0)
    );
    output[7] = (
      extractBitFromInt(state[1], 3, 7) | extractBitFromInt(state[0], 3, 6) |
      extractBitFromInt(state[1], 11, 5) | extractBitFromInt(state[0], 11, 4) |
      extractBitFromInt(state[1], 19, 3) | extractBitFromInt(state[0], 19, 2) |
      extractBitFromInt(state[1], 27, 1) | extractBitFromInt(state[0], 27, 0)
    );
    output[6] = (
      extractBitFromInt(state[1], 2, 7) | extractBitFromInt(state[0], 2, 6) |
      extractBitFromInt(state[1], 10, 5) | extractBitFromInt(state[0], 10, 4) |
      extractBitFromInt(state[1], 18, 3) | extractBitFromInt(state[0], 18, 2) |
      extractBitFromInt(state[1], 26, 1) | extractBitFromInt(state[0], 26, 0)
    );
    output[5] = (
      extractBitFromInt(state[1], 1, 7) | extractBitFromInt(state[0], 1, 6) |
      extractBitFromInt(state[1], 9, 5) | extractBitFromInt(state[0], 9, 4) |
      extractBitFromInt(state[1], 17, 3) | extractBitFromInt(state[0], 17, 2) |
      extractBitFromInt(state[1], 25, 1) | extractBitFromInt(state[0], 25, 0)
    );
    output[4] = (
      extractBitFromInt(state[1], 0, 7) | extractBitFromInt(state[0], 0, 6) |
      extractBitFromInt(state[1], 8, 5) | extractBitFromInt(state[0], 8, 4) |
      extractBitFromInt(state[1], 16, 3) | extractBitFromInt(state[0], 16, 2) |
      extractBitFromInt(state[1], 24, 1) | extractBitFromInt(state[0], 24, 0)
    );
  }

  static feistelFunction(state: number, roundKey: Uint8Array): number {
    // Expansion Permutation
    const t1 = (
      extractBitLeftShift(state, 31, 0) | (state >>> 1) & 0x78000000 |
      extractBitLeftShift(state, 4, 5) | extractBitLeftShift(state, 3, 6) |
      (state >>> 3) & 0x01E00000 |
      extractBitLeftShift(state, 8, 11) | extractBitLeftShift(state, 7, 12) |
      (state >>> 5) & 0x00078000 |
      extractBitLeftShift(state, 12, 17) | extractBitLeftShift(state, 11, 18) |
      (state >>> 7) & 0x00001E00 | extractBitLeftShift(state, 16, 23)
    );
    const t2 = (
      extractBitLeftShift(state, 15, 0) | (state << 15) & 0x78000000 |
      extractBitLeftShift(state, 20, 5) | extractBitLeftShift(state, 19, 6) |
      (state << 13) & 0x01E00000 |
      extractBitLeftShift(state, 24, 11) | extractBitLeftShift(state, 23, 12) |
      (state << 11) & 0x00078000 |
      extractBitLeftShift(state, 28, 17) | extractBitLeftShift(state, 27, 18) |
      (state << 9) & 0x00001E00 | extractBitLeftShift(state, 0, 23)
    );

    const expanded = new Uint8Array(6);
    expanded[0] = (t1 >>> 24) & 0xFF;
    expanded[1] = (t1 >>> 16) & 0xFF;
    expanded[2] = (t1 >>> 8) & 0xFF;
    expanded[3] = (t2 >>> 24) & 0xFF;
    expanded[4] = (t2 >>> 16) & 0xFF;
    expanded[5] = (t2 >>> 8) & 0xFF;

    // XOR with Round Key
    for (let i = 0; i < 6; i++) {
      expanded[i] ^= roundKey[i];
    }

    const sboxInputs = new Int32Array(8);
    sboxInputs[0] = (expanded[0] >> 2);
    sboxInputs[1] = ((expanded[0] & 0x03) << 4) | (expanded[1] >> 4);
    sboxInputs[2] = ((expanded[1] & 0x0F) << 2) | (expanded[2] >> 6);
    sboxInputs[3] = expanded[2] & 0x3F;
    sboxInputs[4] = (expanded[3] >> 2);
    sboxInputs[5] = ((expanded[3] & 0x03) << 4) | (expanded[4] >> 4);
    sboxInputs[6] = ((expanded[4] & 0x0F) << 2) | (expanded[5] >> 6);
    sboxInputs[7] = expanded[5] & 0x3F;

    let sboxOutput = 0;
    sboxOutput |= SBOXES[0][prepareSboxIndex(sboxInputs[0])] << 28;
    sboxOutput |= SBOXES[1][prepareSboxIndex(sboxInputs[1])] << 24;
    sboxOutput |= SBOXES[2][prepareSboxIndex(sboxInputs[2])] << 20;
    sboxOutput |= SBOXES[3][prepareSboxIndex(sboxInputs[3])] << 16;
    sboxOutput |= SBOXES[4][prepareSboxIndex(sboxInputs[4])] << 12;
    sboxOutput |= SBOXES[5][prepareSboxIndex(sboxInputs[5])] << 8;
    sboxOutput |= SBOXES[6][prepareSboxIndex(sboxInputs[6])] << 4;
    sboxOutput |= SBOXES[7][prepareSboxIndex(sboxInputs[7])];

    // P-Box Permutation
    return (
      extractBitLeftShift(sboxOutput, 15, 0) | extractBitLeftShift(sboxOutput, 6, 1) |
      extractBitLeftShift(sboxOutput, 19, 2) | extractBitLeftShift(sboxOutput, 20, 3) |
      extractBitLeftShift(sboxOutput, 28, 4) | extractBitLeftShift(sboxOutput, 11, 5) |
      extractBitLeftShift(sboxOutput, 27, 6) | extractBitLeftShift(sboxOutput, 16, 7) |
      extractBitLeftShift(sboxOutput, 0, 8) | extractBitLeftShift(sboxOutput, 14, 9) |
      extractBitLeftShift(sboxOutput, 22, 10) | extractBitLeftShift(sboxOutput, 25, 11) |
      extractBitLeftShift(sboxOutput, 4, 12) | extractBitLeftShift(sboxOutput, 17, 13) |
      extractBitLeftShift(sboxOutput, 30, 14) | extractBitLeftShift(sboxOutput, 9, 15) |
      extractBitLeftShift(sboxOutput, 1, 16) | extractBitLeftShift(sboxOutput, 7, 17) |
      extractBitLeftShift(sboxOutput, 23, 18) | extractBitLeftShift(sboxOutput, 13, 19) |
      extractBitLeftShift(sboxOutput, 31, 20) | extractBitLeftShift(sboxOutput, 26, 21) |
      extractBitLeftShift(sboxOutput, 2, 22) | extractBitLeftShift(sboxOutput, 8, 23) |
      extractBitLeftShift(sboxOutput, 18, 24) | extractBitLeftShift(sboxOutput, 12, 25) |
      extractBitLeftShift(sboxOutput, 29, 26) | extractBitLeftShift(sboxOutput, 5, 27) |
      extractBitLeftShift(sboxOutput, 21, 28) | extractBitLeftShift(sboxOutput, 10, 29) |
      extractBitLeftShift(sboxOutput, 3, 30) | extractBitLeftShift(sboxOutput, 24, 31)
    );
  }

  static generateKeySchedule(masterKey: Uint8Array, mode: number): Uint8Array[] {
    const keySchedule: Uint8Array[] = new Array(16).fill(null).map(() => new Uint8Array(6));
    const keyRotation = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
    const keyPermC = [
      56, 48, 40, 32, 24, 16, 8, 0, 57, 49, 41, 33, 25, 17, 9, 1,
      58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35
    ];
    const keyPermD = [
      62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5,
      60, 52, 44, 36, 28, 20, 12, 4, 27, 19, 11, 3
    ];
    const keyCompression = [
      13, 16, 10, 23, 0, 4, 2, 27, 14, 5, 20, 9, 22, 18, 11, 3,
      25, 7, 15, 6, 26, 19, 12, 1, 40, 51, 30, 36, 46, 54, 29, 39,
      50, 44, 32, 47, 43, 48, 38, 55, 33, 52, 45, 41, 49, 35, 28, 31
    ];

    let leftHalf = 0;
    let rightHalf = 0;
    let j = 31;

    for (let i = 0; i < 28; i++) {
      leftHalf |= extractBitFromBytes(masterKey, keyPermC[i], j);
      j--;
    }

    j = 31;
    for (let i = 0; i < 28; i++) {
      rightHalf |= extractBitFromBytes(masterKey, keyPermD[i], j);
      j--;
    }

    for (let roundNum = 0; roundNum < 16; roundNum++) {
      const shift = keyRotation[roundNum];
      leftHalf = ((leftHalf << shift) | (leftHalf >>> (28 - shift))) & 0xfffffff0;
      rightHalf = ((rightHalf << shift) | (rightHalf >>> (28 - shift))) & 0xfffffff0;

      const scheduleIndex = (mode === DES.DECRYPT_MODE) ? 15 - roundNum : roundNum;

      for (let k = 0; k < 24; k++) {
        keySchedule[scheduleIndex][Math.floor(k / 8)] |= extractBitFromInt(
          leftHalf, keyCompression[k], 7 - (k % 8)
        );
      }
      for (let k = 24; k < 48; k++) {
        keySchedule[scheduleIndex][Math.floor(k / 8)] |= extractBitFromInt(
          rightHalf, keyCompression[k] - 27, 7 - (k % 8)
        );
      }
    }

    return keySchedule;
  }

  static processBlock(inputBlock: Uint8Array, keySchedule: Uint8Array[]): Uint8Array {
    const state = new Int32Array(2);
    DES.initialPermutation(state, inputBlock);

    for (let roundIdx = 0; roundIdx < 15; roundIdx++) {
      const temp = state[1];
      state[1] = DES.feistelFunction(state[1], keySchedule[roundIdx]) ^ state[0];
      state[0] = temp;
    }

    state[0] = DES.feistelFunction(state[1], keySchedule[15]) ^ state[0];

    const outputBlock = new Uint8Array(8);
    DES.inversePermutation(state, outputBlock);
    return outputBlock;
  }

  static processData(data: Uint8Array, key: Uint8Array, mode: number): Uint8Array {
    const keySchedule = DES.generateKeySchedule(key, mode);
    const result = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i += 8) {
      // Create block, padding with 0 if needed (though typical QRC is 8-byte aligned)
      const inputBlock = new Uint8Array(8);
      const chunk = data.subarray(i, i + 8);
      inputBlock.set(chunk);
      
      const outputBlock = DES.processBlock(inputBlock, keySchedule);
      result.set(outputBlock.subarray(0, chunk.length), i);
    }
    return result;
  }
}

// Utils
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

const stringToBytes = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// Main Decryption Function
export const decryptQRC = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("File read error");

        // 1. Process Bytes directly
        let fileBytes = new Uint8Array(buffer);

        // 2. Skip Header if exists
        // Header Hex: 9825B0ACE3028368E8FC6C (11 bytes)
        const headerBytes = new Uint8Array([0x98, 0x25, 0xB0, 0xAC, 0xE3, 0x02, 0x83, 0x68, 0xE8, 0xFC, 0x6C]);
        let hasHeader = true;
        
        if (fileBytes.length >= 11) {
          for(let i = 0; i < 11; i++) {
             if (fileBytes[i] !== headerBytes[i]) {
                hasHeader = false;
                break;
             }
          }
        } else {
            hasHeader = false;
        }

        if (hasHeader) {
            fileBytes = fileBytes.slice(11);
        }

        // 3. XOR Decryption
        const xorKeyBytes = hexToBytes(XOR_KEY_HEX);
        const xoredBytes = new Uint8Array(fileBytes.length);
        for (let i = 0; i < fileBytes.length; i++) {
            xoredBytes[i] = fileBytes[i] ^ xorKeyBytes[i % xorKeyBytes.length];
        }

        // 4. Triple DES Decrypt (D -> E -> D)
        const k1 = stringToBytes(KEY_1_STR);
        const k2 = stringToBytes(KEY_2_STR);
        const k3 = stringToBytes(KEY_3_STR);

        // Step 1: Decrypt with K1
        let step1 = DES.processData(xoredBytes, k1, DES.DECRYPT_MODE);
        
        // Step 2: Encrypt with K2
        let step2 = DES.processData(step1, k2, DES.ENCRYPT_MODE);
        
        // Step 3: Decrypt with K3
        let step3 = DES.processData(step2, k3, DES.DECRYPT_MODE);

        // 5. ZLib Decompression using Native DecompressionStream
        try {
            if (!('DecompressionStream' in window)) {
                throw new Error("DecompressionStream API is not supported in this browser.");
            }

            // DecompressionStream expects a ReadableStream
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(step3);
                    controller.close();
                }
            });

            // 'deflate' format matches zlib
            const decompressor = new DecompressionStream("deflate"); 
            const decompressedStream = stream.pipeThrough(decompressor);
            
            // Use reader instead of Response to avoid opaque "Failed to fetch" errors
            const reader = decompressedStream.getReader();
            const chunks: Uint8Array[] = [];
            let totalLength = 0;

            while(true) {
                try {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (value) {
                      chunks.push(value);
                      totalLength += value.length;
                  }
                } catch (readError) {
                  // This catches "Junk found after end of compressed data"
                  // If we already have chunks, assume success and stop reading.
                  if (chunks.length > 0) {
                    console.warn("Decompression stream read interrupted (ignoring trailing garbage):", readError);
                    break;
                  } else {
                    throw readError;
                  }
                }
            }

            const chunksAll = new Uint8Array(totalLength);
            let position = 0;
            for(const chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }
            
            let resultXml = new TextDecoder("utf-8").decode(chunksAll);

            // Fix for truncated QRC XML output (as referenced in original Java code)
            if (resultXml.includes("<QrcInfos>") && !resultXml.includes("</QrcInfos>")) {
                resultXml += "\n\"/>\n</LyricInfo>\n</QrcInfos>";
            }

            resolve(resultXml);

        } catch (decompressionError) {
            console.error("Decompression failed", decompressionError);
            // Fallback: The data might not be compressed or compatible. 
            // Try to decode generic text just in case.
            try {
               const rawText = new TextDecoder("utf-8").decode(step3);
               resolve(rawText);
            } catch(e) {
               reject(new Error("Failed to decompress and decode QRC data."));
            }
        }

      } catch (err) {
        console.error(err);
        reject(err);
      }
    };
    
    reader.onerror = (e) => reject(new Error("File reading failed"));
    reader.readAsArrayBuffer(file);
  });
};