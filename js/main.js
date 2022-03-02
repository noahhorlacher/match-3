// UI elements
let UI = {
    score: document.querySelector('score'),
    container: document.querySelector('main')
}

// score
let score

// cells
let grid = []

// cell selection
let selection = []

// if currently is simulating
let simulating = false

// if game is over
let gameover = false

// how long to wait between simulation steps
const STEP_DURATION = 500

// dimensions
const WIDTH = 8;
const HEIGHT = 11;

// possible cell states (possible symbols)
let cell_states

// inject ui
async function setup() {
    // load cell states
    cell_states = await fetch('cell_states.json')
    cell_states = await cell_states.json()

    // create grid
    for (let y = 0; y < HEIGHT; y++) {
        let row = []
        let el_row = document.createElement('row')
        for (let x = 0; x < WIDTH; x++) {
            // create cell
            let cell = document.createElement('cell')
            cell.setAttribute('x', x)
            cell.setAttribute('y', y)
            cell.setAttribute('selected', false)

            // click handling
            cell.addEventListener('click', event => {
                if (simulating || gameover) return

                if (selection.includes(cell)) {
                    // deselect cell
                    selection.splice(selection.indexOf(cell))
                    cell.setAttribute('selected', false)
                } else {
                    // select cell
                    selection.push(cell)
                    cell.setAttribute('selected', true)
                }

                if (selection.length === 2) {
                    // selection full, switch cells
                    let copy = [
                        cell_states[selection[0].getAttribute('data-id')],
                        cell_states[selection[1].getAttribute('data-id')]
                    ]

                    // switch cells
                    selection[0].setAttribute('data-id', copy[1].id)
                    selection[0].textContent = copy[1].icon
                    selection[1].setAttribute('data-id', copy[0].id)
                    selection[1].textContent = copy[0].icon

                    // remove selection
                    selection.forEach(el => el.setAttribute('selected', false))
                    selection = []

                    // check for stability
                    check()
                    simulating = true
                }

                console.log('selection', selection)
            })

            // append cell to row
            row.push(cell)
            el_row.append(cell)
        }
        // append row to container
        grid.push(row)
        UI.container.append(el_row)
    }

    // reset the game 
    reset()
}

// reset game
function reset() {
    // reset variables
    UI.score.textContent = score = 0
    simulating = false
    gameover = false

    // refill grid
    grid.forEach(row => row.forEach(cell => {
        let cell_state = cell_states.random()
        cell.setAttribute('data-id', cell_state.id)
        cell.textContent = cell_state.icon
        cell.setAttribute('value', cell_state.value)
    }))

    // do simulation
    simulating = true
    check()
}

// check for matches recursively until grid is stable
function check() {
    let stable = true

    // check if there are row-matches of 3 or more
    for (let y = 0; y < HEIGHT; y++) {
        symbols_of_array(grid[y]).forEach(symbol => {
            if (array_as_string(grid[y]).match(`${symbol}{3,}`)) stable = false
        })
    }

    /*
    for (let x = 0; x < WIDTH; x++) {

        symbols_of_array(column).forEach(symbol => {
            if (array_as_string(column).match(`${symbol}{3,}`)) stable = false
        })
    }*/

    // check if there are row-matches of 3 or more
    grid.forEach(row => {
        symbols_of_array(row).forEach(symbol => {
            if (array_as_string(row).match(`${symbol}{3,}`)) stable = false
        })
    })

    console.log('stable?', stable)

    // do simulation step if unstable
    if (!stable) {
        let flags = 0
        // go through rows
        for (let y = 0; y < HEIGHT; y++) {
            let last = []
            for (let x = 0; x < WIDTH; x++) {
                if (grid[y][x].getAttribute('data-id') != last[0]?.id) {
                    // match over, flag all as resolving
                    if (last.length > 2) {
                        console.log('flagging', last)
                        flags++
                        last.forEach(cell => grid[y][cell.x].setAttribute('flag', true))
                    }
                    last = []
                } else if ((x == WIDTH - 1 && grid[y][x].getAttribute('data-id') == last[0]?.id)) {
                    last.push({
                        id: grid[y][x].getAttribute('data-id'),
                        x: x
                    })

                    // match over, flag all as resolving
                    if (last.length > 2) {
                        console.log('flagging', last)
                        flags++
                        last.forEach(cell => grid[y][cell.x].setAttribute('flag', true))
                    }
                    last = []
                }

                last.push({
                    id: grid[y][x].getAttribute('data-id'),
                    x: x
                })
            }
        }

        // go through columns
        for (let x = 0; x < WIDTH; x++) {
            let last = []
            for (let y = 0; y < HEIGHT; y++) {
                if (grid[y][x].getAttribute('data-id') != last[0]?.id) {
                    // match over, flag all as resolving
                    if (last.length > 2) {
                        console.log('flagging', last)
                        flags++
                        last.forEach(cell => grid[cell.y][x].setAttribute('flag', true))
                    }
                    last = []
                } else if ((x == HEIGHT - 1 && grid[y][x].getAttribute('data-id') == last[0]?.id)) {
                    last.push({
                        id: grid[y][x].getAttribute('data-id'),
                        y: y
                    })

                    // match over, flag all as resolving
                    if (last.length > 2) {
                        console.log('flagging', last)
                        flags++
                        last.forEach(cell => grid[cell.y][x].setAttribute('flag', true))
                    }
                    last = []
                }

                last.push({
                    id: grid[y][x].getAttribute('data-id'),
                    y: y
                })
            }
        }

        // clear all the flagged symbols
        grid.forEach(row => row.forEach(cell => {
            if (cell.getAttribute('flag') == 'true') {
                cell.textContent = ''
                cell.setAttribute('data-id', cell.getAttribute('x'))
            }
        }))

        // check again
        setTimeout(check, STEP_DURATION)
    } else simulating = false
}

// turn array into string of values
function array_as_string(array) {
    return array.reduce((a, b) => a + b.getAttribute('data-id'), '')
}

// all occuring elements of an array (no duplicates)
function symbols_of_array(array) {
    return array.reduce((a, b) => a.includes(b.getAttribute('data-id')) ? a : [...a, b.getAttribute('data-id')], [])
}

// return a random element from an array
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)]
}

// reset button
document.querySelector('#reset').addEventListener('click', () => reset())

// start
setup()