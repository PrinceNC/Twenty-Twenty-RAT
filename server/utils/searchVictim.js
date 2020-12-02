function searchVictim(victims, uuid) {
    for (let victim of victims)
        if (victim.uuid === uuid)
            return victim;

    return null;
}

module.exports = searchVictim;