addEventListener("DOMContentLoaded", _ => {
	const $id = document.getElementById.bind(document);
	const $name = document.getElementsByName.bind(document);
	const $input = elm => { return document.getElementsByName(elm)[0] };
	fetch("/teachers.csv")
	.then(body => body.text())
	.then(text => {
		let csv = []
		let lines = text.split("\n")
		let fields = lines[0].split(",")
		lines = lines.filter(line => line != "")
		let id = 1;
		for (let line of lines.splice(1)) {
			let selected = 0
			let entry = {}
			let values = line.split(",")
			entry.id = id++;
			for (let field of fields)
				entry[field] = values[selected++]
			csv.push(entry)
		}
		return csv
	})
	.then(csv => {
		for (let teacher of csv) {
			let optionElement = document.createElement("option")
			optionElement.value = teacher.name
			optionElement.setAttribute("json", JSON.stringify(teacher))
			$id("teachers").appendChild(optionElement)
		}
	})
	.catch(err => {
		console.error(err);
		alert("Cannot fetch teachers file, retry...")
	})

	let getCompleteOption = (opt) => {
		for (let child of $id("teachers").children) {
			if (child.getAttribute("value") == opt)
				return child;
		}
		return null;
	}

	$id("teacher-search").addEventListener("change", e => {
		e.preventDefault()
		let chip = document.createElement("span")
		if (getCompleteOption($id("teacher-search").value) == null) return
		chip.classList.add("chip")
		chip.setAttribute("json", getCompleteOption($id("teacher-search").value).getAttribute("json"))
		chip.textContent += $id("teacher-search").value
		deleteme = document.createElement("label")
		deleteme.textContent = '×'
		deleteme.addEventListener("click", e => {
			chip.classList.add("removed")
			setTimeout(_ => $id("teachers-field").removeChild(chip), 200)
		})
		chip.appendChild(deleteme)
		$id("teachers-field").appendChild(chip)
		$id("teacher-search").value = ""
	})

	$id("different-day").addEventListener("click", e => {
		e.preventDefault()
		$id("second-day").style.display = "block"
		$id("different-day").style.display = "none"
	})

	$id("same-day").addEventListener("click", e => {
		e.preventDefault()
		$id("second-day").style.display = "none"
		$input("second-day").value = ""
		$id("different-day").style.display = "inline"
	})

	$id("add-topic").addEventListener("click", e => {
		e.preventDefault()
		let newtopic = $id("topic-template").content.children[0].cloneNode(true)
		$id("topics").appendChild(newtopic)
		newtopic.focus()
	})
	
	// form validation
	$id("form").addEventListener("submit", e => {
		e.preventDefault()
		debugger
		let firstDay = $input("day").value
		let secondDay = $input("second-day").value
	})
})

let removeThisTopic = elm => {
	let topic = elm.parentElement
	topic.classList.add("removed")
	setTimeout(_ => topic.parentElement.removeChild(topic), 200)
}
