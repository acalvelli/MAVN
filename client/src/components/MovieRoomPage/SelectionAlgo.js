import * as React from 'react';
import Axios from 'axios';

// vars to store the query results
var a_group = []; var a_master = [];
var g_group = []; var g_master = [];
var l_group = []; var l_master = [];
var r_group = []; var r_master = [];
var ra_group = []; var ra_master = [];
var rb_group = []; var rb_master = [];


// returns how many movie master genres must match?
const genreMatches = (g) => {
    // if g == 100% must match the number of genres in the master preferences
    const numMatches = Math.round(g_master.length * g);
    return numMatches;
    // if g == 0% does not have to match any genres
}

const ratingAverage = (r) => {
    var group_avg = 0;
    var master_avg = 0;

    // compute average of group
    for (const g in r_group) {
        const curr_val = r_group[g];
        group_avg += (curr_val.value * curr_val.ratio)
    }
    // compute average of group
    for (const m in r_master) {
        const curr_val = r_master[m];
        master_avg += (curr_val.value * curr_val.ratio)
    }
    // takes the movie master bias into account
    group_avg *= (1 - r);
    master_avg *= r;

    // console.log("group avg: " + group_avg);
    // console.log("master avg: " + master_avg);
    // the sum of the averages should be returned, rounds to 10th
    return Math.round(10 * (master_avg + group_avg)) / 10;

}

// compute the average length
const lengthAverage = (l) => {
    var group_avg = 0;
    var master_avg = 0;

    // compute average of group
    for (const g in l_group) {
        const curr_val = l_group[g];
        group_avg += (curr_val.value * curr_val.ratio)
    }

    // compute average of group
    for (const m in l_master) {
        const curr_val = l_master[m];
        master_avg += (curr_val.value * curr_val.ratio)
    }

    // takes the movie master bias into account
    group_avg *= (1 - l);
    master_avg *= l;

    // console.log("length group avg: " + group_avg);
    // console.log("length master avg: " + master_avg);
    // the sum of the averages should be returned
    return Math.round(master_avg + group_avg);

}

// compute the year range
const yearRange = (ry) => {

    var group_min = 2060; var master_min = 2060;
    var group_max = 0; var master_max = 0;

    // compute group min
    for (const g in ra_group) {
        const curr_val = ra_group[g];
        group_min = curr_val.value < group_min ? curr_val.value : group_min;
    }

    // compute group max
    for (const g in rb_group) {
        const curr_val = rb_group[g];
        group_max = curr_val.value > group_max ? curr_val.value : group_max;
    }

    // compute group min
    for (const m in ra_master) {
        const curr_val = ra_master[m];
        master_min = curr_val.value < master_min ? curr_val.value : master_min;
    }

    // compute group ma
    for (const m in rb_master) {
        const curr_val = rb_master[m];
        master_max = curr_val.value > master_max ? curr_val.value : master_max;
    }

    // console.log("group min: " + group_min + " max: " + group_max);
    // console.log("master min: " + master_min + " max: " + master_max);

    // math to compute the ranges
    const min_after = Math.min(group_min, master_min);
    const max_after = Math.max(group_min, master_min);
    const min_before = Math.min(group_max, master_max);
    const max_before = Math.max(group_max, master_max);

    const lower_range = Math.round(min_after + ((max_after - min_after) * ry));
    const upper_range = Math.round(max_before - ((max_before - min_before) * ry));

    // console.log("lower: " + lower_range + " and upper: " + upper_range);

    var res = [];
    // returns the lower and upper ranges
    res.push(lower_range); res.push(upper_range);
    return res;

}

// order the proon list by score of actors present
const actorPref = (a) => {
    // map stores the actor name as key and number of times it is in there * the master preferences as val
    var groupActors = new Map(); // access via map.get
    var masterActors = new Map();

    // add the actors for group and master into maps, rounded to 100ths
    for (const g in a_group) {
        const curr_actor = a_group[g];
        groupActors.set(curr_actor.value, Math.round(100 * curr_actor.numerator * (1 - a)) / 100);
    }

    for (const m in a_master) {
        const curr_actor = a_master[m];
        masterActors.set(curr_actor.value, Math.round(100 * curr_actor.numerator * a) / 100);
    }

    // holds actor names and preference to the 100th, want to maximize the sum of the values
    console.log("group actors:" , groupActors);
    console.log("master actors: ", masterActors);

    const actor_prefs = []
    actor_prefs.push(groupActors);
    actor_prefs.push(masterActors);

    // return list where 0 = group map and 1 = master map
    return actor_prefs;

}

// order the list of movies by the length
const orderProon = async (length_avg, after_yr, before_yr, groupActors, masterActors, movieList) => {
    console.log("ordering the prooned list...");
    // return the ordered movieList, so put into a map and assing a value
    const preOrderList = new Map();

    // for each movie want to compute a value depending on how good a fit
    for (const m in movieList) {
        const curr_movie = movieList[m];
        var finalScore = 0;
        var lengthScore = Math.abs(curr_movie.length - length_avg);
        var yearScore = 0;
        var actorScore = 0;

        // calculate the year score so favours in range, penalizes by how far out of range
        const upperDist = curr_movie.year - after_yr; // positive means above the lower range
        const lowerDist = before_yr - curr_movie.year; // positive means below the upper range
        // falls within range
        if (upperDist >= 0 && lowerDist >= 0) {
            yearScore = upperDist + lowerDist;
        }
        else if (upperDist <= 0 && lowerDist >= 0) {
            // console.log("produced too early");
            // if 10 years before = -0.1 * years from upper
            yearScore = (curr_movie.year - after_yr) / 100 * (before_yr - curr_movie.year);
        }
        else if (upperDist >= 0 && lowerDist <= 0) {
            // if 10 years before = -0.1 * years from upper
            yearScore = (before_yr - curr_movie.year) / 100 * (curr_movie.year - after_yr);
        }

        // compute the actor score
        // get the list of cast members for the current movie 
        try {
            const resp = await Axios.get('http://localhost:3001/getCastMembers', {
                params: {
                    title: curr_movie.title,
                    year: curr_movie.year,
                }
            });
            for (var x of resp.data) {
                console.log(x.actor);
                if(groupActors.has(x.actor)){
                    actorScore += groupActors.get(x.actor);
                }
                if(masterActors.has(x.actor)){
                    actorScore += masterActors.get(x.actor);
                }     
            }
        } catch (err) {
            console.error(err);
        }
    
        // add all scores to final score and add to map
        finalScore += lengthScore + yearScore + actorScore

        // add the movie title and score to the map (k = current movie object, v = score)
        preOrderList.set(curr_movie, finalScore);
    }

    // sort the map in descending order
    const orderedList = new Map([...preOrderList].sort((a, b) => b[1] - a[1]));

    console.log("After sort: ");
    console.log(orderedList);

    return orderedList;
}


// set the group prefs variables
const setGroupPrefs = (group_list) => {

    for (const g in group_list) {
        const curr_table = group_list[g].table;
        const curr_vals = group_list[g].data;
        // console.log("data for " + curr_table + " is %o", curr_vals);

        if (curr_table === 'genre_pref') {
            g_group = curr_vals;
        }
        else if (curr_table === 'length_pref') {
            l_group = curr_vals;
        }
        else if (curr_table === 'rating_pref') {
            r_group = curr_vals;
        }
        else if (curr_table === 'actor_pref') {
            a_group = curr_vals;
        }
        else if (curr_table === 'start_year_pref') {
            ra_group = curr_vals;
        }
        else if (curr_table === 'end_year_pref') {
            rb_group = curr_vals;
        }

    }
}

// set the movie master prefs variables
const setMasterPrefs = (master_list) => {

    for (const m in master_list) {
        const curr_table = master_list[m].table;
        const curr_vals = master_list[m].data;

        // console.log("master data for " + curr_table + " is %o", curr_vals);

        if (curr_table === 'genre_pref') {
            g_master = curr_vals;
        }
        else if (curr_table === 'length_pref') {
            l_master = curr_vals;
        }
        else if (curr_table === 'rating_pref') {
            r_master = curr_vals;
        }
        else if (curr_table === 'actor_pref') {
            a_master = curr_vals;
        }
        else if (curr_table === 'start_year_pref') {
            ra_master = curr_vals;
        }
        else if (curr_table === 'end_year_pref') {
            rb_master = curr_vals;
        }
    }
}

const getFirstProonCall = async (lower, upper, num_genres) => {
    try {
        const resp = await Axios.get('http://localhost:3001/getFirstProon', {
            params: {
                lower: lower,
                higher: upper,
                num_genres: num_genres
            }
        });
        //console.log("data: ", resp.data);
        return resp.data;
    } catch (err) {
        console.error(err);
    }
}

const getMovieGenresFromDB = async (title, year) => {
    //need to run query in server
    try {
        const resp = await Axios.post('http://localhost:3001/getGenresOfMovie', {
            t: title,
            y: year
        });
        //console.log("moviegenres from db: ", resp.data);
        const results = [];
        for (var x of resp.data) {
            results.push(x.genre);
        }
        //console.log("movie genres from db: ", results)
        return results;
    } catch (err) {
        console.error(err);
    }
}

//do this after filter by rating
const proonByGenre = async (genres, num_genres, movie_list) => {
    var res = [];
    var ct = 0;
    //for every single movie, we need to make sure it contains genre matches of at least num_genres.
    for (var movie of movie_list) {
        const movie_genres = await getMovieGenresFromDB(movie.title, movie.year);
        ct = 0;
        for (var g of movie_genres) {
            //console.log("g: %o", g);
            if (genres.includes(g)) {
                ct++;
                //console.log("found a match: ", ct);
                if (ct >= num_genres) {
                    res.push(movie);
                    break;
                }
            }
        }
    }
    console.log("res after pruning by genre: ", res)
    return res;
}

//given master_list, extract into a list of master genres
const getMasterGenres = (master_list) => {
    //console.log("%o", master_list);
    var res = [];
    for (var idx of master_list) {
        //console.log("idx:",idx);
        if (idx.table === 'genre_pref') {
            for (var genre of idx.data) {
                //console.log("genre: ", genre)
                res.push(genre.value);
            }
        }
    }
    //console.log("master genre: ", res)
    return res;
}

// returns a list of movie objects that need to be ordered
const getProonList = async (master_list, num_genres, rating) => {
    //1. does the genre match with moviemaster,
    //2. also meets rating criteria within a buffer of 2.
    const buffer = 2;
    const lower = Math.max(0, Math.floor(rating - buffer));
    const upper = Math.min(10, Math.ceil(rating + buffer));
    // console.log("buffer: [%o, %o]", lower, upper);

    const movies_matching_rating = await getFirstProonCall(lower, upper, num_genres);

    const master_genres = getMasterGenres(master_list);

    const firstProonList = await proonByGenre(master_genres, num_genres, movies_matching_rating);
    return firstProonList;
}

export const selectMovie = async (l, r, g, ry, a, group_list, master_list) => {

    // need to enumerate values from the group preferences
    // console.log("group: %o", group_list);
    // console.log("master: %o", master_list);

    // set the group and master pref variables
    setGroupPrefs(group_list);
    setMasterPrefs(master_list);

    // movie selection order
    // 1) contains one of all genres and rating >= average rating to nearest 10th
    // this is how many genres must be matched to MOVIE MASTER genres
    const num_genres = genreMatches(g);

    // does not include the over/under buffer yet
    const rating_val = ratingAverage(r);

    // 2) Length = same as rating, buffer of 30 minutes
    const length_val = lengthAverage(l);

    // 3) Release year: min of released before and max of released after as range, 
    const res = yearRange(ry);
    // split the result into lower and upper
    const lower_range = res[0];
    const upper_range = res[1];

    //lets proon the list. we'll first target movies that are within the rating buffer, then run it through genre filtering using master_list.
    const prooned_list = await getProonList(master_list, num_genres, rating_val);

    // 4) Actors servers as the ???order by??? once the ???prooned??? list is computed, 
    // 100% actors in movie from pref = at the top, 0 = at the bottom of the list ??? alters the score
    const actorMaps = actorPref(a);
    const groupMap = actorMaps[0];
    const masterMap = actorMaps[1];

    const orderedProon = await orderProon(length_val, lower_range, upper_range, groupMap, masterMap, prooned_list);

    // print the prooned list by title (if need image do key.image)
    // orderedProon.forEach(function(value, key) {
    //     console.log(key.title + " = " + value);
    // })

    return orderedProon;

}

