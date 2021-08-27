let foodPaths = [];
  for (let i = 0; i < state.food.data.length; i++) {
    // enable reckless search when STARVING
    result = aStarSearch(state, ourHead, [state.food.data[i]], ourSnake.health <= STARVING);
    if (result.status != 'success') continue;
    result.goal = 'FOOD';
    foodPaths.push(result);
  }

  // eliminate unsafe food paths
  results = foodPaths.filter((result) => {
    // eliminate paths we can't reach in time
    if (result.path.length > ourSnake.health) return false;

    // eliminate food close to the head of a bigger enemy snake
    if (enemyDistance(state, result.path[result.path.length - 1]) < 3) return false;

    // eliminate paths we can't fit into (compute space size pessimistically)
    if (getSpaceSize(state, result.path[1], true) < ourSnake.body.data.length) return false;

    return true;
  });

  // determine closest food
  let closestFood = results.length && results.reduce((closest, current) => {
    return Math.min(current.path.length, closest);
  }, Number.MAX_SAFE_INTEGER);

  // we want to the be closest snake to at least one piece of food
  // determine how close we are vs. how close our enemies are
  let foodDistances = [];
  for (let i = 0; i < results.length; i++) {
    result = results[i];
    let foodNode = result.path[result.path.length - 1];
    let ourDistance = distance(ourHead, foodNode);
    let otherDistance = enemyDistance(state, foodNode);
    foodDistances.push({
      foodNode,
      ourDistance,
      enemyDistance: otherDistance,
      advantage: otherDistance - ourDistance
    })
  }
  let foodAdvantages = foodDistances.slice().sort((a, b) => b.advantage - a.advantage);
  let foodOpportunities = foodDistances.slice().sort((a, b) => b.enemyDistance - a.enemyDistance);
  let foodAdvantage = foodAdvantages.length && foodAdvantages[0];
  let foodOpportunity = foodOpportunities.length && foodOpportunities[0];

  // 'must eat' if STARVING or steps to food consume >=60% of health
  // 'should eat' if HUNGRY or steps to food consume >=30% of health
  // 'chase food' if food advantage is < 5
  let safeFood = results.length > 0;
  let mustEat = ourSnake.health <= STARVING || closestFood >= (ourSnake.health * .6);
  let shouldEat = safeFood && (ourSnake.health <= HUNGRY || closestFood >= (ourSnake.health * .3));
  let chaseFood = safeFood && foodAdvantage && foodAdvantage.advantage < 5;
  console.log('MUST/SHOULD/CHASE', mustEat, shouldEat, chaseFood);

  // if we must eat, but can't reach food, re-introduce unsafe paths
  let reachableFood = results.find(result => result.path.length < ourSnake.health);
  if (mustEat && !reachableFood) {
    results = foodPaths.slice();
  }

  // if eating is optional, seek tail nodes
  if (!mustEat || !results.length) {
    let tailTargets = goodNeighbors(state, ourTail);
    if (!isGrowing(ourSnake)) tailTargets.push(ourTail);
    for (let i = 0; i < tailTargets.length; i++) {
      result = aStarSearch(state, ourHead, [tailTargets[i]]);
      if (result.status != 'success') continue;
      if (result.path.length === 1) continue;
      result.goal = 'TAIL';
      results.push(result);
    }
  }

  // if eating is optional, consider head shots
  if (!mustEat) {
    try {
      let headShots = goodNeighbors(state, ourHead, true);
      for (let i = 0; i < headShots.length; i++) {
        // can only head shot smaller snakes
        let smallerSnake = isPossibleNextMove(state, getSmallerSnakes(state), headShots[i]);
        if (!smallerSnake) continue;

        // favor our guess at their next move
        let guessNext = guessNextMove(state, smallerSnake);
        results.push({
          goal: 'HEADSHOT',
          path: [ourHead, headShots[i]],
          cost: guessNext && isSameNode(headShots[i], guessNext) ? 0 : 1
        })
      }
    } catch (error) {
      // this code was added game day, don't trust it ^^
    }
  }

  // adjust the cost of paths
  for (let i = 0; i < results.length; i++) {
    let result = results[i];
    let path = result.path;
    let endNode = path[path.length - 1];
    let startNode = path[1];

    // heavily if we would starve en-route
    if (result.path.length > ourSnake.health) {
      result.cost += COST_HEAVY;
    }

    // heavily if end point has no path back to our tail
    if (!hasPathToTail(state, endNode, ourSnake)) {
      result.cost += COST_HEAVY;
    }

    // heavily/moderately/lightly if not a food path and we must-eat/should-eat/chase-food
    if (result.goal !== 'FOOD') {
      if (mustEat) {
        result.cost += COST_HEAVY;
      } else if (shouldEat) {
        result.cost += COST_MODERATE;
      } else if (chaseFood) {
        result.cost += COST_LIGHT;
      }
    }

    // lightly if a food path and we should not be eating
    if (result.goal === 'FOOD' && (!shouldEat && !mustEat && !chaseFood)) {
      result.cost += COST_LIGHT;
    }

    // lightly if: food path, multiple food paths, not our advantage and not most available
    if (result.goal === 'FOOD'
      && state.food.data.length > 1
      && foodAdvantage
      && (getNodeHash(endNode) !== getNodeHash(foodAdvantage.foodNode) || foodAdvantage.advantage < 1)
      && foodOpportunity
      && getNodeHash(endNode) !== getNodeHash(foodOpportunity.foodNode)
    ) {
      result.cost += COST_LIGHT;
    }
  }

  // if we found paths to goals, pick cheapest one
  if (results.length) {
    results.sort((a, b) => {
      return a.cost - b.cost;
    });
    results.forEach(result => console.log(result.goal, result.cost, result.path.length));
    return moveResponse(
      res,
      direction(ourHead, results[0].path[1]),
      'A* BEST PATH TO ' + results[0].goal
    );
  }
