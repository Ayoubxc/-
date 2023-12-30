const Database = require("@replit/database");
const db = new Database();

const weapons = require('../weapons.json');
/**
 * POST
 * @required: userID, accessToken
 * Success: status 200
 */
exports.register = async (req, res) => {
    const allTokens = process.env['TOKENS'].split("_") || [];
    const { userID, accessToken } = req.body;
    if (!accessToken) return res.status(400).json({
        message: "Missing Token"
    });
    if (!userID) return res.status(400).json({
        message: "Missing ID"
    });
    if (!allTokens.some(e => e == accessToken)) return res.status(400).json({
        message: "Invalid Token"
    });
    db.get(String(userID))
        .then(data => {
            if (data) {
                res.status(400).json({
                    message: "Already registered"
                });
                return;
            } else {
                const newUserData = {
                    userID,
                    weaponID: 0,
                    shuriken: 0,
                    win: 0,
                    lose: 0
                }
                db.set(String(userID), newUserData)
                    .then(data => {
                        res.json({
                            message: "Register success",
                            data: newUserData,
                            image: weapons[0].image
                        })
                        return;
                    })
                    .catch(e => {
                        res.status(400).json({
                            message: "Something went wrong, try again later."
                        })
                        return;
                    })
            }
        })
        .catch(e => {
            res.status(400).json({
                message: "Something went wrong, try again later."
            })
            return;
        })
};

exports.buy = async (req, res) => {
    const allTokens = process.env['TOKENS'].split("_") || [];
    if (!allTokens.some(e => e == req.body.accessToken)) return res.status(400).json({
        message: "Invalid Token"
    });


    const { userID, weaponID, amount } = req.body;

    if (!weaponID) return res.status(400).json({
        message: "Missing Weapon ID"
    });
    if (!userID) return res.status(400).json({
        message: "Missing User ID"
    });


    const userData = await db.get(String(userID));

    if (!userData) return res.status(400).json({
        message: "Invalid User ID"
    });
    if (isNaN(weaponID) || weaponID < 0 || weaponID > (weapons.length - 1)) return res.status(400).json({
        message: "Invalid Weapon ID"
    });
    if (weaponID == userData.weaponID && weaponID != 6) return res.status(400).json({
        message: "You already have this weapon."
    });
    if (weaponID < userData.weaponID) return res.status(400).json({
        message: "You can't downgrade weapon."
    });


    if (weaponID < 6) userData.weaponID = weaponID;
    else {
        if (amount && !isNaN(amount)) {
            if (amount < 1 || amount > 20) return res.status(400).json({
                message: "Invalid amount, please choose between 1 and 20"
            });
            if (userData.shuriken + amount > 20) return res.status(400).json({
                message: `Insufficient storage, you can only buy ${20 - userData.shuriken} shuriken(s)`
            });
            userData.shuriken += amount;
        }
    }
    db.set(String(userID), userData)
        .then(data => {
            if (weaponID < 6) {
                console.log(`Updated ${userID} weapon to level ${weaponID}`);
                res.json({
                    message: "Success",
                    weapon: weapons[weaponID]
                });
                return;
            }
            else {
                console.log(`Updated ${userID} shuriken amount to ${weaponID}`);
                res.json({
                    message: "Success",
                    shuriken: {
                        amount: userData.shuriken,
                        data: weapons[6]
                    }
                });
                return;
            }

        })
        .catch(e => {
            console.log(e);
            res.status(400).json({
                message: "Something went wrong, try again later."
            });
            return;
        });
}

exports.fight = async (req, res) => {
    const allTokens = process.env['TOKENS'].split("_") || [];
    if (!allTokens.some(e => e == req.body.accessToken)) return res.status(400).json({
        message: "Invalid Token"
    });


    const { hunterID, victimID } = req.body;

    if (!hunterID) return res.status(400).json({
        message: "Missing Hunter ID"
    });
    if (!victimID) return res.status(400).json({
        message: "Missing Victim ID"
    });


    const hunterData = await db.get(String(hunterID));
    const victimData = await db.get(String(victimID));

    if (!hunterData) return res.status(400).json({
        message: "Invalid Hunter ID"
    });
    if (!victimData) return res.status(400).json({
        message: "Invalid Victim ID"
    });

    const result = calculateWinner(hunterData, victimData);
    if (result == 0) {
        hunterData.win++;
    } else {
        hunterData.lose++;
    }
    if (hunterData.shuriken > 0) hunterData.shuriken--;
    const message = `${result == 0 ? 'Hunter' : 'Victim'} Won!`;
    await db.set(String(hunterID), hunterData);
    res.json({
        result,
        message
    });
    return;
}


exports.weapons = (req, res) => {
    const allTokens = process.env['TOKENS'].split("_") || [];
    if (!allTokens.some(e => e == req.query.accessToken)) return res.status(400).json({
        message: "Invalid Token"
    });
    res.json(weapons);
    return;
}
exports.list = async (req, res) => {
    const mySecret = process.env['ADMIN_TOKEN'] || '';
    if (req.query.accessToken != mySecret) return res.status(400).json({
        message: "what tha hell are ya doin here?"
    });
    const keys = await db.list();
    const data = [];
    for (const key of keys) {
        try {
            let eachData = await db.get(key);
            data.push(eachData);
        } catch (e) {
            keys.splice(keys.indexOf(key), 1);
            continue;
        }
    }
    const resObj = {
        length: keys.length,
        keys,
        data
    }
    res.json(resObj);
    return;
}
exports.info = async (req, res) => {
    const mySecret = process.env['ADMIN_TOKEN'] || '';
    if (req.query.accessToken != mySecret) return res.status(400).json({
        message: "what tha hell are ya doin here?"
    });


    const { userID } = req.query;
    if (!userID) return res.status(400).json({
        message: "Missing User ID"
    });

    const userData = await db.get(String(userID));;
    if (!userData) return res.status(400).json({
        message: "Invalid User ID"
    });

    userData.weapon = weapons[userData.weaponID];
    delete userData.weaponID;

    res.json({
        userID,
        data: userData
    });
    return;
}

/**
 * Error: return false
 * Hunter won: 0, Victim won: 1
 */
function calculateWinner(hunter, victim) {
    if (!hunter || (!hunter.weaponID && hunter.weaponID != 0) || !victim || (!victim.weaponID && victim.weaponID != 0)) return false;

    const hunterShuriken = hunter.shuriken ? 15 : 0;
    const victimShuriken = victim.shuriken ? 15 : 0;

    const hunterPower = weapons[hunter.weaponID].power + hunterShuriken;
    const victimPower = weapons[victim.weaponID].power + victimShuriken;

    const hunter_subtract_victim = hunterPower - victimPower;
    const percentWin = Math.ceil(Math.random() * 100);
    if (hunter_subtract_victim < 0) {
        if (hunter_subtract_victim > -15) {
            if (percentWin < 45) return 0;
            else return 1;
        } else {
            if (percentWin < 30) return 0;
            else return 1;
        }
    } else {
        if (hunter_subtract_victim <= 15) {
            if (percentWin < 55) return 1;
            else return 0;
        } else {
            if (percentWin < 20) return 1;
            else return 0;
        }
    }
}