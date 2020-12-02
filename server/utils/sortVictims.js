// Sort victim by online status - online victims will be first
function sortVictims(victims) {
    victims.sort((a, b) => {
        if ((a && a.ipAddress != undefined) && (b && b.ipAddress == undefined))
            return -1;

        if ((a && a.ipAddress == undefined) && (b && b.ipAddress != undefined))
            return 1;

        return 0;
    });

    return victims;
}

module.exports = sortVictims;