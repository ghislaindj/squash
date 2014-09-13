var casper = require('casper').create();
var casper_require = patchRequire(require);
var config = casper_require('./credentials');

// casper.options.verbose = true;
// casper.options.logLevel = 'debug';
casper.options.waitTimeout = 10000;

casper.on('remote.message', function(msg) {
    this.echo('Console: ' + msg, 'WARNING');
});

casper.on('timeout', function() {
    casper.capture('/tmp/fail-' + new Date() + '.png');
});

casper.start('http://fr.wanaplay.com/auth/login', function() {
    this.fill('#login_form', {
        login: config.username,
        passwd: config.password
    }, true);
    this.echo("Logged in", "INFO");
});

casper.thenOpen('http://fr.wanaplay.com/plannings/espacesportifpontoise/act/Squash', function() {
    this.evaluate(function() {
        var date = new Date();
        date.setDate(14 + date.getDate());
        dateChanged({dateClicked: true, date: date})
    });
    this.echo("Changed date", "INFO");
});

casper.wait(1000);

casper.waitForSelector('#planning table>tbody>tr>td table>tbody>tr:nth-of-type(21) td.creneauLibre', function() {
    this.evaluate(function() {
        // automatically find a free court
        document.querySelector('#planning table>tbody>tr>td table>tbody>tr:nth-of-type(21) td.creneauLibre').onclick();
    });
    this.echo("Selected a free court", "INFO");
});

casper.waitForUrl(/takeReservationShow/, function() {
    this.evaluate(function() {
        document.querySelector('#users_0').value = document.querySelector('#users_0 option').value;
        document.querySelector('button[name="commit"]').click();
    });
    this.echo("Submitted reservation", "INFO");
});

casper.waitForUrl(/takeReservationConfirm/, function() {
    this.evaluate(function() {
        document.querySelector('button[name="commit"]').click();
    });
    this.echo("Confirmed reservation", "INFO");
});

casper.waitForUrl(/espacesportifpontoise/, function() {
    casper.capture('/tmp/result.png');
});

casper.run();