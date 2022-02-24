import * as Elements from './elements.js'
import { routePathnames } from '../controller/route.js';
import * as Util from './util.js'
import { currentUser } from '../controller/firebase_auth.js';
import * as CloudFunctions from '../controller/cloud_functions.js'
import * as Constants from '../model/constants.js'

let loader = `<div style="position: absolute; right: 50%">
<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
</div>
</div>`

export function addEventListeners() {
    Elements.menuUsers.addEventListener('click', async () => {
        history.pushState(null, null, routePathnames.USERS);
        const label = Util.disableButton(Elements.menuUsers);
        await users_page();
        Util.enableButton(Elements.menuUsers, label);

        
    });
}

export async function users_page() {
    document.getElementById('productView').style.display = 'none'
    if (!currentUser) {
        Elements.root.innerHTML = '<h1>Protected Page</h1>'
        return;
    }
    let html = `
    <h1>Welcome to User Management Page</h1>
    <div class="input-group" style="align-items: center">
        <div class="form-outline">
        <input type="search" id="searchingBox" class="form-control" placeholder="Search" />
        </div>
        <button type="button" class="btn btn-primary" style="height: fit-content" id="searchButton">
        <i class="fa fa-search"></i>
        </button>
    </div>
    `;
    let userList;
    try {
userList = await CloudFunctions.getUserList();
    } catch (e) {
if (Constants.DEV) console.log(e);
Util.info('Failed to get user list', JSON.stringify(e));
return;
    }
    let tableData = document.createElement("table")
    tableData.className = "table table-striped"
    tableData.innerHTML = `<thead>
        <tr>
        <th scope="col">Email</th>
        <th scope="col">Status</th>
        <th scope="col">Actions</th>
        </tr>
    </thead>`

    let element = document.createElement('tbody')
    element.id = "tableDataSection"

    userList.forEach(user => {
        element.innerHTML += buildUserRow(user);
    });
    tableData.appendChild(element)

    html += tableData.outerHTML

    Elements.root.innerHTML = ''
    Elements.root.innerHTML = html
    
    document.getElementById('searchButton').onclick = searchUsers

    const manageForms = document.getElementsByClassName('form-manage-users');
    for (let i = 0; i < manageForms.length; i++) {
        manageForms[i].addEventListener('submit', async e => {
            e.preventDefault();
            const submitter = e.target.submitter;
            const buttons = e.target.getElementsByTagName('button');
            if (submitter == 'TOGGLE') {
const label = Util.disableButton(buttons[0]);
await toggleDisableUser(e.target);
Util.enableButton(buttons[0], label);
            } else if (submitter == 'DELETE') {
    const label = Util.disableButton(buttons[1]);
await deleteUser(e.target);
Util.enableButton(buttons[0], label);

            } else {
                if (Constants.DEV) console.log(e);
            }

            })
        
    }
}
async function toggleDisableUser(form) {
const uid = form.uid.value;
const disabled = form.disabled.value;
const update = {
    disabled: disabled == 'true' ? false : true,
}
document.getElementById(`user-status-${uid}`).innerHTML = `${update.disabled ? 'Disabled' : 'Active'}`;
Util.info('Status toggled!', `Disabled: ${update.disabled}`);
try {
await CloudFunctions.updateUser(uid, update);
form.disabled.value = `${update.disabled}`;
} catch (e) {
if (Constants.DEV) console.log(e);
Util.info('Toggle user status failed', JSON.stringify(e));
}
}
async function deleteUser(form) {
// confirm
if (!window.confirm('Press OK to delete the user')) return;
const uid = form.uid.value;
try {
await CloudFunctions.deleteUser(uid);
document.getElementById(`user-row-${uid}`).remove();
Util.info('The user deleted!', `UID=${uid}`);
} catch (e) {
if (Constants.DEV) console.log(e);
Util.info('Delete user failed', JSON.stringify(e));
}
}
function buildUserRow(user) {
    return `
    <tr id="user-row-${user.uid}">
    <td>${user.email}</td>
    <td id="user-status-${user.uid}">${user.disabled ? 'Disabled' : 'Active'}</td>
    <td>
    <form class="form-manage-users" method="post">
    <input type="hidden" name="uid" value="${user.uid}">
    <input type="hidden" name="disabled" value="${user.disabled}">
    <button type="submit" class="btn btn-outline-primary"
    onClick="this.form.submitter='TOGGLE'">Toggle Active</button>
    <button type="submit" class="btn btn-outline-danger"
    onClick="this.form.submitter='DELETE'">Delete</button>

    
    </form>
    </td>
    </tr>
    
    `;
}

async function searchUsers() {
    document.getElementById('tableDataSection').innerHTML = loader
    let content = document.getElementById('searchingBox').value

    let users;

    try {
        users = !!content ? await CloudFunctions.getUserListBySearching(content.toLowerCase()) : await CloudFunctions.getUserList();
    } catch (e) {
        if (Constants.DEV) console.log(e);
        Util.info('Cannot get users List by searchUsers', JSON.stringify(e));

        return;

    }
    document.getElementById('tableDataSection').innerHTML = ''

    users.forEach(p => {
        document.getElementById('tableDataSection').innerHTML += buildUserRow(p);
    });

    if (!users.length) {
        document.getElementById('tableDataSection').innerHTML = '<h3>No Users</h3>'
    }
}