const LOTTERY_DATA_VIP_ACCESS_OFFSET = {
    0: Number.MAX_SAFE_INTEGER,
    1: Number.MAX_SAFE_INTEGER,
    2: Number.MAX_SAFE_INTEGER,
    3: Number.MAX_SAFE_INTEGER,
    4: Number.MAX_SAFE_INTEGER,
}

const PermissionName = {
    level0: {
        name: 'level0',
        permissions: [
            ['root'], ['level6'], ['level5'], ['level4'], ['level3'], ['level2'], ['level1'], ['level0']
        ]
    },
    level1: {
        name: 'level1',
        permissions: [
            ['root'], ['level6'], ['level5'], ['level4'], ['level3'], ['level2'], ['level1']
        ]
    },
    level2: {
        name: 'level2',
        permissions: [
            ['root'], ['level6'], ['level5'], ['level4'], ['level3'], ['level2']
        ]
    },
    level3: {
        name: 'level3',
        permissions: [
            ['root'], ['level6'], ['level5'], ['level4'], ['level3']
        ]
    },
    level4: {
        name: 'level4',
        permissions: [
            ['root'], ['level6'], ['level5'], ['level4']
        ]
    },
    level5: {
        name: 'level5',
        permissions: [
            ['root'], ['level6'], ['level5']
        ]
    },
    level6: {
        name: 'level6',
        permissions: [
            ['root'], ['level6']
        ]
    },
        root: {
        name: 'root',
        permissions: [['root']]
    },
}

const permissionMap = new Map([
    ['/api/v1/account/*', PermissionName.level6],
    ['/api/v1/do_lottery/*',PermissionName.level6]
])
module.exports = {
    LOTTERY_DATA_VIP_ACCESS_OFFSET,
    permissionMap
}