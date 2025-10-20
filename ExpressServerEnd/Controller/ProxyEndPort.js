const express = require("express");
const router = express.Router();
const proxy = require('express-http-proxy');
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");

router.use('/api/v1/samsClub/graphql',
    proxy(
        utils.MYAPI.base_url,
        {
            proxyReqPathResolver: (req) => {
                return req.baseUrl
            }
        }
    )
)
router.use('/*rpa/',
    proxy(
        utils.RPA.base_url,
        {
            proxyReqPathResolver: (req) => {
                return req.baseUrl
            }
        }
    )
)
module.exports = router;