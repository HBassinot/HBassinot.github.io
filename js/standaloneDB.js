// Variables
var debug_mode = true;
var debug_msg = "";
var debug_selector = "#debug_db";
var account;

var TYPE_DEBIT = "DEBIT";
var TYPE_CREDIT = "CREDIT";

// Ouverture de la DB
var db = openDatabase('emove', '1.0', 'EMOVE_DB', 2 * 1024 * 1024);

// Initialisation de la DB
db.transaction(function (tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS emove_accounts (acc_id INTEGER PRIMARY KEY AUTOINCREMENT, acc_name unique, acc_description, acc_amount)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS emove_operations (ope_id INTEGER PRIMARY KEY AUTOINCREMENT, ope_description, ope_type, ope_date, ope_number, ope_amount, ope_amount_before, ope_amount_after, ope_tag, acc_id)');

    if(debug_mode) {
        debug_msg = '<p>tables: accounts & operations created.</p>';
        document.querySelector(debug_selector).innerHTML += debug_msg;
    }
});

// Creation d'un nouveau compte
function createAccount(acc_name, acc_description, acc_amount) {
    db.transaction(function (tx) {
       tx.executeSql('INSERT INTO emove_accounts (acc_name, acc_description, acc_amount) VALUES ("'+acc_name+'", "'+acc_description+'", '+acc_amount+')');

        if(debug_mode) {
            debug_msg = '<p>account: new account created ('+acc_name+').</p>';
            document.querySelector(debug_selector).innerHTML += debug_msg;
        }
    });
}

// retourne le compte qui correspond à l'id et 
function getAccount(acc_id) {
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM emove_accounts WHERE acc_id = ' + acc_id, [], function (tx, results) {
            var len = results.rows.length, i;
            
            if(len != 0) {
                account = results.rows.item(0);
                debug_msg = "<p>Account found: " + acc_id + "</p>";
            } else {
                account = null;
                debug_msg = "<p>Account not found: " + acc_id + "</p>";
            }

            if(debug_mode) { 
                document.querySelector(debug_selector).innerHTML += debug_msg;
            }
        }, null);
    });
}

// Credite le compte du montant passé en parametre
function creditAccount(tx, acc_id, amount) {
    a = account.acc_amount + amount;
    tx.executeSql('UPDATE emove_accounts SET acc_amount='+a+' WHERE acc_id='+acc_id);
    return a;
}

// Debite le compte
function debitAccount(tx, acc_id, amount) {
    a = account.acc_amount - amount;
    tx.executeSql('UPDATE emove_accounts SET acc_amount='+a+' WHERE acc_id='+acc_id);
    return a;
}

// Creation d'une nouvelle operation
function createOperation(ope_date, ope_description, ope_type, ope_amount, acc_id) {
    getAccount(acc_id);
    db.transaction(function (tx) {

    if(account) {
        if(TYPE_DEBIT == ope_type) {
            ope_amount_after = debitAccount(tx, acc_id, ope_amount);
        }
        else if (TYPE_CREDIT == ope_type) {
            ope_amount_after = creditAccount(tx, acc_id, ope_amount);
        }
        else {
            return;
        }
        ope_number = 1;

        tx.executeSql('INSERT INTO emove_operations (ope_description, ope_type, ope_date, ope_number, ope_amount, ope_amount_before, ope_amount_after, acc_id) VALUES ("'+ope_description+'", "'+ope_type+'", "'+ope_date+'", '+ope_number+', '+ope_amount+', '+account.acc_amount+', '+ope_amount_after+', '+acc_id+')');

        if(debug_mode) {
            debug_msg = '<p>insert new operation into table.</p>';
            document.querySelector(debug_selector).innerHTML += debug_msg;
        }
    }
    });
}


createAccount("Compte courant Desjardins", "ceci est mon compte", 8137.71);
