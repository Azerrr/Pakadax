import CUSTOM_POKEMONS_DATA from "../data/pokemons.js";

"use strict";

const API_URL = "https://graphqlpokemon.favware.tech/v8";

const POKEMON_LIST_QUERY = `query GetAllPokemon {
  getAllPokemon {
    key
    species
  }
}
`;

const MOVES_LIST_QUERY = `query {
  __type(name: "MovesEnum") {
    enumValues {
      name
    }
  }
}
`;

function getPokemonQuery(name) {
  return `query GetPokemon {
    getPokemon(pokemon: ${name}, reverseFlavorTexts: true, takeFlavorTexts: 1) {
      species
      sprite
      cry
      baseStats {
        hp
        attack
        defense
        specialattack
        specialdefense
        speed
      }
      types {
        name
      }
      abilities {
        first {
          name
        }
        second {
          name
        }
        special {
          name
        }
        hidden {
          name
        }
      }
      evolutionLevel
      preevolutions {
        key
        species
      }
      evolutions {
        key
        species
        evolutionLevel
      }
      height
      weight
      gender {
        male
        female
      }
      eggGroups
      minimumHatchTime
      maximumHatchTime
    }
  }
  `;
}

function getLearnsetQuery(name, movesList) {
  return `query GetLearnset {
    getLearnset(pokemon: ${name}, moves: [${movesList}]) {
      levelUpMoves {
        generation
        level
        move {
          name
        }
      }
      tmMoves {
        generation
        move {
          name
        }
      }
      eggMoves {
        generation
        move {
          name
        }
      }
      tutorMoves {
        generation
        move {
          name
        }
      }
    }
  }
`;
}

const DEFAULT_POKEMON = {
  "getPokemon": {
    "species": null,
    "sprite": null,
    "cry": null,
    "baseStats": {
      "hp": null,
      "attack": null,
      "defense": null,
      "specialattack": null,
      "specialdefense": null,
      "speed": null
    },
    "types": null,
    "abilities": {},
    "evolutionLevel": null,
    "preevolutions": null,
    "evolutions": [],
    "height": null,
    "weight": null,
    "gender": {
      "male": null,
      "female": null
    },
    "eggGroups": [],
    "minimumHatchTime": null,
    "maximumHatchTime": null
  }
};

const DEFAULT_LEARNSET = {
  "getLearnset": {
    "levelUpMoves": [],
    "tmMoves": [],
    "eggMoves": [],
    "tutorMoves": []
  }
};

async function cachedFetch(query, key, defaultValue) {
  if (!sessionStorage.getItem(key)) {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Accept": "Application/json",
        "Content-Type": "Application/json"
      },
      body: JSON.stringify({
        query: query
      })
    });
    sessionStorage.setItem(key, JSON.stringify(await response.json()));
  }
  let result = JSON.parse(sessionStorage.getItem(key));
  if (result.errors) {
    return defaultValue;
  }
  else {
    return result.data;
  }
}

function replace(field, value) {
  if (!value) {
    value = "Unknown";
  }
  filledHtml = filledHtml.replace(new RegExp("{{" + field + "}}", 'g'), value);
}

function updatePage() {
  document.body.innerHTML = filledHtml;
}

function capitalize(string) {
  let nextCap = true;
  let result = "";
  for (let i = 0; i < string.length; i++) {
    result += nextCap ? string[i].toUpperCase() : string[i];
    nextCap = !(string[i].match(/[a-z]/i));
  }
  return result;
}

async function fillPokemonList() {

  // Get pokemons list

  let pokemons = await cachedFetch(POKEMON_LIST_QUERY, "pokemonsList", "{}");
  let pokemonsList = pokemons.getAllPokemon.sort((a, b) => a.species.localeCompare(b.species));

  // Place data in page

  let pokemonsTable = [];
  pokemonsList.forEach((pokemon) => {
    pokemonsTable.push("<tr><td><a href=./pages/pokemon.html?pokemon=" + pokemon.key + ">" + capitalize(pokemon.species) + "</a></td></tr>");
  });
  replace("PokemonsTable", "<table>" + pokemonsTable.join("\n") + "</table>");
}

async function fillLearnset(name) {
  console.log("start fillLearnset");

  // Get moves list

  let allMoves = await cachedFetch(MOVES_LIST_QUERY, "movesList", null);
  let allMovesList = allMoves.valueOf().__type.enumValues.map(move => move.name);
  // console.log(movesList);

  // Get learnset data

  let learnset = await cachedFetch(getLearnsetQuery(name, allMovesList), "learnset_" + name, DEFAULT_LEARNSET);
  learnset = learnset.getLearnset;
  // console.log(learnset);

  // Place data in page

  // Level Up Move List
  let lastGen = Math.max(...learnset.levelUpMoves
    .map(move => move.generation));
  learnset.levelUpMoves = learnset.levelUpMoves
    .filter((move) => move.generation === lastGen)
    .sort((move1, move2) => move1.level - move2.level);
  let moves = [];
  learnset.levelUpMoves.forEach((move) => {
    moves.push("<tr><td><b>" + move.level + "</b></td><td>" + move.move.name + "</td></tr>");
  });
  replace("Moves", "<table>" + moves.join("\n") + "</table>");
  // TM Move List
  lastGen = Math.max(...learnset.tmMoves
    .map(move => move.generation));
  learnset.tmMoves = learnset.tmMoves
    .filter((move) => move.generation === lastGen)
    .sort((move1, move2) => move1.move.name.localeCompare(move2.move.name));
  replace("TmMoves", learnset.tmMoves.map(move => move.move.name).join(", "));
  // Egg Move List
  lastGen = Math.max(...learnset.eggMoves
    .map(move => move.generation));
  learnset.eggMoves = learnset.eggMoves
    .filter((move) => move.generation === lastGen)
    .sort((move1, move2) => move1.move.name.localeCompare(move2.move.name));
  replace("EggMoves", learnset.eggMoves.map(move => move.move.name).join(", "));
  // Tutor Move List
  lastGen = Math.max(...learnset.tutorMoves
    .map(move => move.generation));
  learnset.tutorMoves = learnset.tutorMoves
    .filter((move) => move.generation === lastGen)
    .sort((move1, move2) => move1.move.name.localeCompare(move2.move.name));
  replace("TutorMoves", learnset.tutorMoves.map(move => move.move.name).join(", "));

  console.log("end fillLearnset");
}

async function fillPokemonData(name) {
  console.log("start fillPokemonData");

  // Fill pokemon learnset

  let learnsetPromise = fillLearnset(name);

  // Get pokémon data

  let pokemon = await cachedFetch(getPokemonQuery(name), "pokemon_" + name, DEFAULT_POKEMON);
  pokemon = { ...pokemon.getPokemon, ...CUSTOM_POKEMONS_DATA[name] };
  // console.log(pokemon);

  // Place data in page

  // General
  if (pokemon.cry) {
    replace("CrySrc", "<source id=\"cry\" src=\"" + pokemon.cry + "\" type=\"audio/mpeg\">");
  } else {
    replace("CrySrc", "Unknown");
  }
  if (pokemon.sprite) {
    replace("ImageSrc", "<img id=\"image\" src=" + pokemon.sprite + " alt=\"{{Name}} sprite\" onclick=\"document.getElementById('audio').play();\">");
  } else {
    replace("ImageSrc", "Unknown sprite");
  }
  replace("Name", capitalize(pokemon.species));
  // Base stats
  replace("HP", pokemon.baseStats.hp);
  replace("Attack", pokemon.baseStats.attack);
  replace("Defense", pokemon.baseStats.defense);
  replace("SpecialAttack", pokemon.baseStats.specialattack);
  replace("SpecialDefense", pokemon.baseStats.specialdefense);
  replace("Speed", pokemon.baseStats.speed);
  // Basic information
  replace("Type", pokemon.types.map(type => type.name).join(" / "));
  let abilities = "";
  for (let ability in pokemon.abilities) {
    if (pokemon.abilities[ability] && pokemon.abilities[ability].name) {
      abilities += "<tr><td><b>" + capitalize(ability) + "</b>:</td><td>" + pokemon.abilities[ability].name + "</td></tr>";
    }
  }
  replace("Abilities", "<table>" + abilities + "</table>");
  // Evolutions
  if (pokemon.preevolutions) {
    let preevolutions = [];
    pokemon.preevolutions.forEach((preevolution) => {
      preevolutions.push("<a href=?pokemon=" + preevolution.key + ">" + capitalize(preevolution.species) + "</a> (" + pokemon.evolutionLevel + ")");
    });
    replace("Preevolutions", preevolutions.join(",<br/>&emsp;"));
  }
  else {
    replace("Preevolutions", "none");
  }
  if (pokemon.evolutions) {
    let evolutions = [];
    pokemon.evolutions.forEach((evolution) => {
      evolutions.push("<a href=?pokemon=" + evolution.key + ">" + capitalize(evolution.species) + "</a> (" + evolution.evolutionLevel + ")");
    });
    replace("Evolutions", evolutions.join(",<br/>&emsp;"));
  }
  else {
    replace("Evolutions", "none");
  }
  // Size
  replace("Height", pokemon.height);
  replace("Weight", pokemon.weight);
  // Breeding
  replace("MRatio", pokemon.gender.male);
  replace("FRatio", pokemon.gender.female);
  replace("EggGroup", pokemon.eggGroups.join(", "));
  let hatchTime = (pokemon.minimumHatchTime + pokemon.maximumHatchTime) / 2;
  replace("HatchRate", hatchTime + " ± " + Math.round(hatchTime - pokemon.minimumHatchTime));
  // Living
  replace("Diet", pokemon.diet?.join(", "));
  replace("Habitat", pokemon.habitat?.join(", "));
  // Capabilities
  replace("Capabilities", pokemon.capabilities?.map(
    capability => [capability.name, capability.level, capability.additionalData ? "(" + capability.additionalData + ")" : undefined]
      .filter(item => item)
      .join(" ")
  ).join(", "));
  // Skills
  replace("Skills", pokemon.skills?.map(
    skill => [skill.name, skill.dice ? "(" + skill.dice + ")" : undefined]
      .filter(item => item)
      .join(" ")
  ).join(", "));

  console.log("end fillPokemonData");
  await learnsetPromise;
  console.log("end fillLearnset waiting");
}

// Manage page data

var filledHtml = document.body.innerHTML;
let url = window.location.href.split("/");
let page = url[url.length - 1].split("?")[0];
switch (page) {
  case "index.html":
  case "":
    fillPokemonList().then(updatePage);
    break;
  case "pokemon.html":
    let pokemonName = new URLSearchParams(window.location.search).get("pokemon");
    if (pokemonName) {
      document.title = capitalize(pokemonName) + " — Pakadax"
      fillPokemonData(pokemonName).then(updatePage);
    }
    else {
      console.error("No pokemon name in parameter!");
    }
    break;
}
