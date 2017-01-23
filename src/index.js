var React = require("react");
var ReactDOM = require("react-dom");
var Flux = require("flux");
var EventEmitter  = require('events').EventEmitter;
import './index.css';


//var head = document.getElementsByTagName("head")[0]
//head.innerHTML += '<link rel="stylesheet" href="path/to/font-awesome/css/font-awesome.min.css">';


var r = 40;
var c = 40;

var a = Array.from(Array(r*c).keys());

var E = a.map(function(d, i) { return (i+1) - ( (i+1)%c === 0 ? c : 0 ); });
var W = a.map(function(d, i) { return (i-1) + ( (i+0)%c === 0 ? c : 0 ); });
var N = a.map(function(d, i) { return (i-c) + ( i >= c ? 0 : r*c);});
var S = a.map(function(d, i) { return (i+c) - ( i < (r*c) - c ? 0 : r*c); });

var cBoard = [];
var nBoard = [];

class Cell {
    constructor(index, neighbors, isAlive) {
        this.index = index;
        this.neighbors = neighbors;
        this.isAlive = isAlive;

        this.getState = this.getState.bind(this);
    };

    getState() {
        var livingNeighbors = this.neighbors.map((d) => { 
            return cBoard[d] 
        }).filter((d) => { 
            return d.isAlive 
        }).length;

        if (this.isAlive) {
            if (livingNeighbors >= 2 && livingNeighbors <= 3) {
                return true;
            };
        } else {
            if (livingNeighbors === 3) {
                return true;
            };
        };
        return false;
    };
};

for (var i = 0; i < r*c; i++) {
    var neighbors = [
        W[N[i]], N[i], E[N[i]], E[i], E[S[i]], S[i], W[S[i]], W[i]
    ];
    var isAlive = Math.floor(Math.random() * 9) % 9 === 0 ? true : false;
    cBoard.push(new Cell(i, neighbors, isAlive));
    nBoard.push(new Cell(i, neighbors, false));
};





var Constants = {
    RUN_CLICKED: null,
    TICK_CLICKED: null,
    CLEAR_CLICKED: null,
    CELL_CLICKED: null,
    FF_CLICKED: null,
    ROW_CHANGE: null,
    COL_CHANGE: null,

    VIEW_ACTION: null,
    TICK_ACTION: null,

    CHANGE_EVENT: null,
    BOARD_UPDATE: null,
};

for (var key in Constants) {
    if (true) { Constants[key] = key; };
};


// Dispatcher
//
var Dispatcher = new Flux.Dispatcher();
Dispatcher.handleAction = function(action) {
    this.dispatch({
        source: Constants.VIEW_ACTION,
        action: action,
    });
};

Dispatcher.handleTick = function(action) {
    this.dispatch({
        source: Constants.TICK_ACTION,
        action: action,
    });
};

var Actions = {
    runClicked: function() {
        Dispatcher.handleAction({
            actionType: Constants.RUN_CLICKED,
            data: null,
        });
    },
    tickClicked: function() {
        Dispatcher.handleAction({
            actionType: Constants.TICK_CLICKED,
            data: null,
        });
    },
    ffClicked: function() {
        Dispatcher.handleAction({
            actionType: Constants.FF_CLICKED,
            data: null,
        });
    },
    clearClicked: function() {
        Dispatcher.handleAction({
            actionType: Constants.CLEAR_CLICKED,
            data: null,
        });
    },
    cellClicked: function(i, item) {
        Dispatcher.handleAction({
            actionType: Constants.CELL_CLICKED,
            data: {
                index: i,
                item: item,
            },
        });
    },
    tick: function() {
        Dispatcher.handleTick({
            actionType: Constants.BOARD_UPDATE,
            data: { 
            },
        });
    },
    rowChange: function(item) {
        Dispatcher.handleAction({
            actionType: Constants.ROW_CHANGE,
            data: item,
        });
    },
    colChange: function(item) {
        Dispatcher.handleAction({
            actionType: Constants.COL_CHANGE,
            data: item,
        });
    },
};

var speeds = [1000, 500, 250, 125, 63];

var _store = {
    running: false,
    board: cBoard,
    rows: r,
    cols: c,
    generation: 0,
    intervalID: null,
    speed: 0,
    tick: false,
};

var Store = Object.assign({}, EventEmitter.prototype, {
    addChangeListener: function(cb) {
        this.on(Constants.CHANGE_EVENT, cb);
    },
    removeChangeListener: function(cb) {
        this.removeListener(Constants.CHANGE_EVENT, cb);
    },
    getBoard: function() {
        return _store.board;
    },
    getSize: function() {
        return {rows: _store.rows, cols: _store.cols};
    },
    isRunning: function() {
        return _store.running;
    },
    getGeneration: function() {
        return _store.generation;
    }
});

Dispatcher.register(function(payload) {
    var action = payload.action;
    switch(action.actionType) {
        case Constants.CELL_CLICKED:
            var cell = _store.board[action.data.index];
            cell.isAlive = !cell.isAlive;
            break;
        case Constants.RUN_CLICKED:
            _store.running = !_store.running;
            break;
        case Constants.TICK_CLICKED:
            if (_store.running) {
                return true;
            }
            _store.tick = true;
            break;
        case Constants.CLEAR_CLICKED:
            for (var i = 0; i < _store.board.length; i++) {
                _store.board[i].isAlive = false;
            }
            _store.generation = 0;
            _store.running = false;
            break;
        case Constants.BOARD_UPDATE:
            _store.board = cBoard;
            break;
        case Constants.FF_CLICKED:
            console.log("ff clicked", _store.speed);
            _store.speed = (_store.speed + 1) % speeds.length;
            console.log("ff clicked", _store.speed);
            clearInterval(_store.intervalID);
            startTicks();
            break;
        case Constants.ROW_CHANGE:
            var rows = action.data.target.value;
            if (rows < 10 || rows > 100) {
                return true;
            }
            var f = {rows: _store.rows, cols: _store.cols};
            _store.rows = +rows;
            var t = {rows: _store.rows, cols: _store.cols};
            boardResize(f, t);
            break;
        case Constants.COL_CHANGE:
            var cols = action.data.target.value;
            if (cols < 10 || cols > 100) {
                return true;
            }
            var f = {rows: _store.rows, cols: _store.cols};
            _store.cols = +cols;
            var t = {rows: _store.rows, cols: _store.cols};
            boardResize(f, t);
            break;
        default:
            return true;
    };
    Store.emit(Constants.CHANGE_EVENT);
});

function boardResize(f, t) {
    var r = t.rows;
    var c = t.cols;
    E = a.map(function(d, i) { return (i+1) - ( (i+1)%c === 0 ? c : 0 ); });
    W = a.map(function(d, i) { return (i-1) + ( (i+0)%c === 0 ? c : 0 ); });
    N = a.map(function(d, i) { return (i-c) + ( i >= c ? 0 : r*c);});
    S = a.map(function(d, i) { return (i+c) - ( i < (r*c) - c ? 0 : r*c); });
    function newBoard() {
        var nb = [];
        var nnb = [];
        for (var i = 0; i < t.rows*t.cols; i++) {
            var neighbors = [
                W[N[i]], N[i], E[N[i]], E[i], E[S[i]], S[i], W[S[i]], W[i]
            ];
            //var isAlive = Math.floor(Math.random() * 9) % 9 === 0 ? true : false;
            nb.push(new Cell(i, neighbors, false));
            nnb.push(new Cell(i, neighbors, false));
        };
        return [nb, nnb];
    };

    var b = newBoard();
    var nb = b[0];
    var nnb = b[1];
    // resize smaller
    if (nb.length < cBoard.length) {
        var delta = (cBoard.length - nb.length);
        for (var i = 0; i < nb.length; i++) {
            nb[i].isAlive = cBoard[i].isAlive;
        };
    } else {
        var delta = (nb.length - cBoard.length); 
        for (var i = 0; i < cBoard.length; i++) {
            nb[i].isAlive = cBoard[i].isAlive;
        };
    };
    cBoard = nb;
    nBoard = nnb;
}

function tick() {
    for (var i = 0; i < cBoard.length; i++) {
        nBoard[i].isAlive = cBoard[i].getState();
    };
    for (var j = 0; j < cBoard.length; j++) {
        cBoard[j].isAlive = nBoard[j].isAlive;
    }
    _store.generation += 1;
    Actions.tick();
}

function startTicks() {
    _store.intervalID = setInterval(function() {
        if (_store.running || _store.tick) {
            tick();
            _store.tick = false;
        }
    }, speeds[_store.speed]);
}
startTicks();

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    };

    render() {
        return (
                <div>
                <TopControls />
                <Board />
                </div>

               );
    };
};

class TopControls extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            generation: 0,
        };

        this._onChange = this._onChange.bind(this);
    };

    componentDidMount() {
        Store.addChangeListener(this._onChange); 
    };

    componentWillUnmount() {
        Store.removeChangeListener(this._onChange);
    };

    _onChange() {
        this.setState({
            generation: Store.getGeneration(),
        });
    };

    render() {
        return (
                <div id="top-controls">
                <div onClick={Actions.runClicked}   className={"button fa fa-" + (Store.isRunning() ? "pause" : "play")} id="run"></div>
                <div onClick={Actions.tickClicked}  className="button fa fa-step-forward" id="tick"></div>
                <div onClick={Actions.ffClicked} className="button fa fa-fast-forward" id="fast-forward"><span id="factor">{"x"+Math.pow(2, _store.speed) }</span></div>
                <div onClick={Actions.clearClicked} className="button fa fa-refresh" id="clear"></div>
                <div className="text" id="generation" >
                Generation:<div id="count" style={{display: "inline-block"}}>{" " + this.state.generation}</div>
                </div> 
                </div>
               );
    };
};

class Board extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            rows: Store.getSize().rows,
            cols: Store.getSize().cols,
            board: Store.getBoard(),
        };
        this._onChange = this._onChange.bind(this);
    };

    componentDidMount() {
        Store.addChangeListener(this._onChange); 
    };

    componentWillUnmount() {
        Store.removeChangeListener(this._onChange);
    };

    _onChange() {
        var size = Store.getSize();
        this.setState({
            rows: size.rows,
            cols: size.cols,
            board: Store.getBoard(),
        });
    };

    render() {
        var cells = [];
        for (var r = 0; r < this.state.rows; r++) {
            var row = [];
            for (var c = 0; c < this.state.cols; c++) {
                var index = (this.state.cols * r) + c;
                var state = this.state.board[index].isAlive ? "alive" : "dead";
                row.push(
                        <div 
                        key={index} 
                        className={"cell " + state} 
                        onClick={Actions.cellClicked.bind(this, index)}
                        ></div>);
            };
            cells.push(<div key={"row-" + r} className="row">{row}</div>);
        };
        return (
                <div id="board">
                <div className="cells ps-top-to-bottom">
                {cells}
                </div>
                </div>
               );
    }
}

ReactDOM.render(
        <App />,
        document.getElementById('root')
        );

