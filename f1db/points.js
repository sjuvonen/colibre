// Sort results from best to worst.
function compare_results(a, b) {
  return a.driver.localeCompare(b.driver) || a.placement - b.placement;
}

// Sort drivers from first to last.
function compare_drivers(a, b) {
  return b.total - a.total;
}

function partition_results(season_results, ...sizes) {
  const chunks = sizes.map(() => []);

  for (let entry of season_results) {
    if (entry.round <= sizes[0]) {
      chunks[0].push(entry);
    } else if (entry.round <= sizes[0] + sizes[1]) {
      chunks[1].push(entry);
    } else if (entry.round <= sizes[0] + sizes[2] + sizes[3]) {
      chunks[2].push(entry);
    } else if (entry.round <= sizes[0] + sizes[2] + sizes[3] + sizes[4]) {
      chunks[3].push(entry);
    }
  }

  return chunks;
}

function merge_partitions(...chunks) {
  const cache = new Map;

  for (let chunk of chunks) {
    chunk.forEach(entry => {
      let result = cache.get(entry.driver);

      if (result) {
        result.total += entry.total;
      } else {
        cache.set(entry.driver, Object.assign({}, entry));
      }
    })
  }

  return [...cache.values()].sort(compare_drivers);
}

function calculate_best_results(season_results, max_valid_results) {
  const cache = new Map;
  const standings = [];

  season_results.sort(compare_results);

  for (let entry of season_results) {
    const r = cache.get(entry.driver);

    if (r) {
      if (r.length < max_valid_results) {
        r.push(entry);
      }
    } else {
      cache.set(entry.driver, [entry]);
    }
  }

  for (let results of cache.values()) {
    let final = {
      driver: results[0].driver,
      total: 0,
      seasonTotal: 0,
    };

    results.forEach((entry) => final.total += entry.points);
    standings.push(final);
  }

  standings.sort(compare_drivers);

  return standings;
}

function from_1981_to_1990(season_results) {
  return calculate_best_results(season_results, 11);
}

function pre_1981(year, season_results) {
  return merge_partitions(...partition_results(season_results, 7, 8).map(c => calculate_best_results(c, 4)));
}

module.exports = {
  pre_1981,
  from_1981_to_1990,
};
