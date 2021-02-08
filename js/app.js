const TEAM_COUNT = 12;

var addPlayerUUID = null;
var addPlayerUsername = null;

var sortDirection = true;

$(function () {
	for (let i = 1; i <= TEAM_COUNT; i++) {
		$(".player-team-select").append(new Option("Team " + i, i));
	}

	$("#btn_add_player_open").on("click", function () {
		$('#add_player_modal').modal('show');
		setTimeout(function () {
			$("#add_player_username").trigger('focus');
		}, 500);
	});

	$("#btn_search_player").on("click", function () {
		searchPlayer();
	});

	$("#add_player_username").on("input propertychange paste", function () {
		$("#player_preview_div").hide();
		$("#btn_add_player").prop('disabled', true);
		addPlayerUUID = null;
		addPlayerUsername = null;
	});

	$("#btn_add_player").on("click", function () {
		if ($('.player-tr[data-uuid="' + addPlayerUUID + '"]').length > 0) {
			showError("That player has already been added");
		} else {
			$("#btn_add_player").prop('disabled', true);
			//console.log("add player " + addPlayerUUID + " " + addPlayerUsername);

			$("#add_player_username").val("");
			$("#player_preview_div").hide();

			addPlayer(addPlayerUUID, addPlayerUsername, -1);

			$("#player_preview_div").hide();
			addPlayerUUID = null;
			addPlayerUsername = null;
			$('#add_player_modal').modal('hide');

			$("#player_table").stupidtable_build();
			sortTable();

			setTimeout(function () {
				$("#btn_add_player_open").trigger('focus');
			}, 100);
		}
	});

	$("#add_player_username").on("keypress", function (e) {
		if (e.key == "Enter") {
			searchPlayer();
		}
	});

	$("#col_team_number").on("click", function () {
		sortDirection = !sortDirection;
		sortTable();
	});

	$("#btn_export_json").on("click", function () {
		exportJSON();
	});

	$("#btn_download_json").on("click", function () {
		var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent($("#json_output").text());
		var downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", "teams.json");
		document.body.appendChild(downloadAnchorNode); // required for firefox
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	});

	$("#player_preview_div").hide();
	$(".sort-direction").hide();

	$("#player_table").stupidtable();

	$("#player_table").on('aftertablesort', function (event, data) {
		$(".sort-direction").hide();
		$(".sort-direction-" + data.direction).show();
	});

	sortTable();

	try {
		let exportCookie = getCookie("exported_team_data");

		if(exportCookie.length > 0) {
			let teamData = JSON.parse(exportCookie);

			teamData.forEach(element => {
				addPlayer(element.uuid, element.username, element.team_number);
			});
		}
	} catch (err) {
		console.error(err);
	}

	setCookie("exported_team_data", "", 0);
});

function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function addPlayer(uuid, username, teamNumber) {
	let newPlayer = $("#player_tr_template").clone();

	newPlayer.removeAttr('id');
	newPlayer.addClass("player-tr");

	newPlayer.attr("data-uuid", uuid);
	newPlayer.attr("data-username", username);

	newPlayer.find(".player-uuid").text(uuid);
	newPlayer.find(".player-username").text(username);

	newPlayer.find(".player-avatar").attr("src", "https://crafatar.com/avatars/" + uuid);

	newPlayer.find(".btn-remove-player").on("click", function () {
		$(this).parent().parent().remove();
	});

	newPlayer.find(".player-team-select").val(teamNumber).change();

	newPlayer.find(".player-team-select").on("change", function () {
		let value = $(this).children("option:selected").val();

		$(this).parent().attr("data-sort-value", value);
		$(this).parent().parent().attr("data-team-number", value);

		$(this).parent().updateSortVal(value);

		sortTable();
	});

	$("#player_thead").append(newPlayer);
}

function searchPlayer() {
	let username = $("#add_player_username").val();

	if (username.length > 0) {
		$.getJSON("https://api.minetools.eu/uuid/" + username, function (data) {
			//console.log(data);
			if (data.status == "OK") {
				let uuid = fixUUID(data.id);
				//console.log("The uuid of " + username + " is " + uuid);
				$.getJSON("https://api.minetools.eu/profile/" + uuid, function (profileData) {
					let realUsername = profileData.decoded.profileName;

					//console.log("The real username is " + realUsername);

					$("#preview_image").attr("src", "https://crafatar.com/avatars/" + uuid);
					$("#preview_uuid").text(uuid);
					$("#preview_username").text(realUsername);

					addPlayerUUID = uuid;
					addPlayerUsername = realUsername;

					$("#btn_add_player").prop('disabled', false);

					$("#player_preview_div").show();

					$("#btn_add_player").trigger('focus');
				});
			} else {
				showError("Could not find player");
			}
		});
	} else {
		showError("Please provide a username");
	}
}

function exportJSON() {
	let data = getData();
	console.log(data);
	var hlt = hljs.highlight('json', print_r(data));
	$("#json_output").html(hlt.value)

	$("#json_export_modal").modal('show');
}

function print_r(object, html) {
	if (html) return '<pre>' + JSON.stringify(object, null, 4) + '</pre>';
	else return JSON.stringify(object, null, 4);
}


function loadData(data) {
	$(".player-tr").remove();

	for (let i = 0; i < data.length; i++) {
		let player = data[i];

		addPlayer(player.uuid, player.username, player.team_number);
	}
}

function getData() {
	let data = [];

	$(".player-tr").each(function () {
		let uuid = $(this).data("uuid");
		let username = $(this).data("username");
		let teamNumber = $(this).data("team-number");

		data.push({
			uuid: uuid,
			username: username,
			team_number: teamNumber
		});
	});

	return data;
}

function sortTable() {
	$("#col_team_number").stupidsort(sortDirection ? "asc" : "desc");
}

function fixUUID(uuid) {
	return uuid.substr(0, 8) + "-" + uuid.substr(8, 4) + "-" + uuid.substr(12, 4) + "-" + uuid.substr(16, 4) + "-" + uuid.substr(20);
}

function showInfo(message) {
	showMessage(message, "info");
}

function showWarning(message) {
	showMessage(message, "warning");
}

function showError(message) {
	console.warn(message);
	showMessage(message, "danger");
}

function showMessage(message, type) {
	$.notify({
		message: message
	}, {
		type: type,
		allow_dismiss: true,
		delay: 3000,
		z_index: 1337
	});
}