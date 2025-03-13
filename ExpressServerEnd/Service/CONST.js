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
             ['6'], ['5'], ['4'], ['3'], ['2'], ['1'], ['0']
        ]
    },
    level1: {
        name: 'level1',
        permissions: [
            ['6'], ['5'], ['4'], ['3'], ['2'], ['1']
        ]
    },
    level2: {
        name: 'level2',
        permissions: [
            ['6'], ['5'], ['4'], ['3'], ['2']
        ]
    },
    level3: {
        name: 'level3',
        permissions: [
          ['6'], ['5'], ['4'], ['3']
        ]
    },
    level4: {
        name: 'level4',
        permissions: [
             ['6'], ['5'], ['4']
        ]
    },
    level5: {
        name: 'level5',
        permissions: [
            ['6'], ['5']
        ]
    },
    level6: {
        name: 'level6',
        permissions: [
             ['6']
        ]
    },

}

const permissionMap = new Map([
    ['/api/v1/account/add_account', PermissionName.level6],
    ['/api/v1/do_lottery/*', PermissionName.level6]
])
module.exports = {
    LOTTERY_DATA_VIP_ACCESS_OFFSET,
    permissionMap
}