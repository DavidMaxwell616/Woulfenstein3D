export const W = 900;
export const H = 600;
export const pickupData = {
    52: { score: 100, health: 0 },    // cross
    53: { score: 500, health: 0 },    // chalice
    54: { score: 1000, health: 0 },    // chest of jewels
    55: { score: 5000, health: 0 },    // crown
    47: { score: 0, health: 15 },     // food 
    48: { score: 0, health: 25 },     // first aid 
    29: { score: 0, health: 4 },     // dog food
};

export const weaponPickupData = {
    28: 1, // pistol pickup
    50: 2, // machine gun pickup
    51: 3  // gatling gun pickup
};

export const weapons = {
    0: {
        name: "Knife",
        animation: "knife",
        range: 1.25,
        damage: 35,
        ammo: false,
        fireDelay: 350
    },

    1: {
        name: "Pistol",
        animation: "pistol",
        range: 8,
        damage: 25,
        ammo: true,
        fireDelay: 400
    },

    2: {
        name: "Machine Gun",
        animation: "machine_gun",
        range: 18,
        damage: 50,
        ammo: true,
        fireDelay: 80
    },

    3: {
        name: "Gatling Gun",
        animation: "gatling_gun",
        range: 28,
        damage: 100,
        ammo: true,
        fireDelay: 40
    }
};