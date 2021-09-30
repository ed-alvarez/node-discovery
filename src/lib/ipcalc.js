const THIRTY_TWO_BITS = 4294967295;
const MAX_BIT_VALUE = 32;
const MAX_BIT_BIN = 255;

const unpackInt = input => {
    return -1 << (MAX_BIT_VALUE - input);
};

const qdotToInt = ip => {
    let x = 0;

    x += +Number(ip[0]) << 24 >>> 0;
    x += +Number(ip[1]) << 16 >>> 0;
    x += +Number(ip[2]) << 8 >>> 0;
    x += +Number(ip[3]) >>> 0;

    return x;
};

const intToQdot = integer => {
    return [
        integer >> 24 & MAX_BIT_BIN,
        integer >> 16 & MAX_BIT_BIN,
        integer >> 8 & MAX_BIT_BIN,
        integer & MAX_BIT_BIN
    ].join('.');
};

const getCidr = input => {
    const arr = input.split('.');

    let x = arr.reduce((p, c) =>
        (p << 8 | c) >>> 0);

    x -= (x >>> 1) & 0x55555555;
    x = (x & 0x33333333) + (x >>> 2 & 0x33333333);

    return ((x + (x >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
};

const fhosts = hv => {
    let a = hv || 0;

    if (a >= 2)
        a = 2 ** (MAX_BIT_VALUE - hv) - 2;

    return a;
};

const fsubnets = base => {
    const modBase = base % 8;
    return modBase ? 2 ** modBase : 2 ** 8;
};

const getClass = ip => {
    if (ip < 128)
        return 'Class A';

    if (ip < 192)
        return 'Class B';

    if (ip < 224)
        return 'Class C';

    if (ip < 240)
        return 'Class D';

    if (ip < 256)
        return 'Class E';

    if (!ip || ip < 0 || isNaN(ip))
        throw Error('IP is not valid.');
};

const networkAddress = (ip, sm) => {
    return intToQdot(ip & sm);
};

const broadcastAddress = (ip, sm) => {
    return intToQdot(ip | (~sm & THIRTY_TWO_BITS));
};

const getCidrFromHost = input => {
    return Number(input) !== 0
        ? MAX_BIT_VALUE - Math.ceil(Math.log(input) / Math.log(2)) : 0;
};

const addressToHex = address => {
    return '0x' + address.toString(16).toUpperCase();
};

const getSubmask = ip => {
    let [base, submask] = ip.split('/');

    if (submask > MAX_BIT_VALUE) {
        base = getCidrFromHost(submask);
        submask = intToQdot(unpackInt(base));
    } else if (submask <= MAX_BIT_VALUE) {
        base = submask;
        submask = intToQdot(unpackInt(submask));
    } else {
        base = getCidr(submask);
    }

    return {
        base,
        submask
    };
};

exports.parse = ipInput => {
    const ipArr = ipInput.split('.');
    const netmask = getSubmask(ipInput);
    const hosts = fhosts(Number(ipInput.split('/').pop()));

    const networkAddr = networkAddress(
        qdotToInt(ipArr),
        qdotToInt(netmask.submask.split('.'))
    );

    const broadcastAddr = broadcastAddress(
        qdotToInt(ipArr),
        qdotToInt(netmask.submask.split('.'))
    );

    const nard = networkAddr.split('.');
    const bard = broadcastAddr.split('.');

    nard[3] = +Number(nard[3]) + 1;
    bard[3] = +Number(bard[3]) - 1;

    return {
        address: ipInput.split('/').shift(),
        addressHex: addressToHex(
            qdotToInt(ipArr)
        ),
        addressDecimal: qdotToInt(ipArr),
        netmask,
        wildcard: intToQdot(
            ~qdotToInt(netmask.submask.split('.'))
        ),
        networkAddr,
        netMin: nard.join('.'),
        netMax: bard.join('.'),
        broadcastAddr,
        ipClass: getClass(ipArr[0]),
        subnets: fsubnets(netmask.submask),
        hosts
    };
};
