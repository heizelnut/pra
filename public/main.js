(function() {
	const $id = document.getElementById.bind(document)
	const $name = document.getElementsByName.bind(document)
	const $input = elm => { return document.getElementsByName(elm)[0] }

	document.addEventListener("DOMContentLoaded", _ => {
		let selectedTeachers = []
		let topics = []

		$id("day").valueAsDate = new Date()

		fetch('/me')
		.then(response => response.json())
		.then(user => {
			document.getElementById('account-name').textContent = user.name.givenName
		})

		fetch("/teachers.csv")
		.then(body => body.text())
		.then(text => {
			let csv = []
			let lines = text.split("\n")
			let fields = lines[0].split(",")
			lines = lines.filter(line => line != "")
			let id = 1
			for (let line of lines.splice(1)) {
				let selected = 0
				let entry = {}
				let values = line.split(",")
				entry.id = id++
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
				optionElement.setAttribute("email", teacher.email)
				optionElement.setAttribute("code", teacher.id)
				$id("teachers").appendChild(optionElement)
			}
		})
		.catch(err => {
			console.error(err)
			alert("Cannot fetch teachers file, retry...")
		})

		let getCompleteOption = (opt) => {
			for (let child of $id("teachers").children) {
				if (child.getAttribute("value") == opt)
					return child
			}
			return null
		}

		$id("teacher-search").addEventListener("change", e => {
			e.preventDefault()
			let chip = document.createElement("span")
			if (getCompleteOption($id("teacher-search").value) == null) return
			if (selectedTeachers.indexOf(parseInt(getCompleteOption($id("teacher-search").value).getAttribute("code"))) != -1) {
				$id("teacher-search").value = ""
				return
			}
			chip.classList.add("chip")
			chip.setAttribute("title", getCompleteOption($id("teacher-search").value).getAttribute("email"))
			chip.setAttribute("code", getCompleteOption($id("teacher-search").value).getAttribute("code"))
			chip.textContent += $id("teacher-search").value
			deleteme = document.createElement("label")
			deleteme.textContent = '×'
			deleteme.addEventListener("click", e => {
				chip.classList.add("removed")
				for(const teacher of selectedTeachers) {
					if(teacher == chip.getAttribute("code")) {
						selectedTeachers.splice(selectedTeachers.indexOf(teacher), 1)
						break
					}
				}
				setTimeout(_ => $id("teachers-field").removeChild(chip), 200)
			})
			chip.appendChild(deleteme)
			$id("teachers-field").appendChild(chip)
			selectedTeachers.push(JSON.parse(chip.getAttribute("code")))
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
		
		$id("submit").addEventListener("click", e => {
			if (e.target.hasAttribute["disabled"]) return
			e.preventDefault()
			for(const topic of $id("topics").children) {
				topics.push(topic.childNodes[1].value)
			}
			fetch('/send', {
				method: "POST",
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					firstDay: $input("day").value,
					secondDay: $input("second-day").value,
					firstHour: parseInt($input("first-hour").value),
					secondHour: parseInt($input("second-hour").value),
					teachers: selectedTeachers.map(id => parseInt(id)),
					topics: topics
				})
			})
			.then(res => {
				if (res.ok)
					location.href = "/success"
				else
					return res.json()
			}).then(json => {
				console.error(json)
				if (json.description) {
					$id("errorMessage").innerHTML = json.description
					$id("errorMessage").style.display = 'block'
				}
			})
			.catch(err => {
				$id("errorMessage").style.display = 'block'
				$id("errorMessage").textContent = err
			})
		})
	})

	let validateForm = _ => {
		let canSend = true

		// rules:
		//   the meeting should be booked at least 5 days prior
		//   cannot have same hour if same day is selected
		//   cannot have same day if second day is selected
		//   at least 3 topics of discussion, at most 6
		//   at least 1 teacher selected, at most 3
		
		const DEADLINE_PERIOD_IN_DAYS = 5
		const MIN_TOPICS = 3
		const MAX_TOPICS = 6
		const MIN_TEACHERS = 1
		const MAX_TEACHERS = 3

		let differentDays = ($id("second-day").style.display != 'none')
		let deadline = new Date()
		deadline.setDate(deadline.getDate() + DEADLINE_PERIOD_IN_DAYS)

		// deadline check
		let firstDate = new Date($input("day").value)
		let secondDate = new Date($input("second-day").value)
		
		if (firstDate < deadline) {
			$input("day").classList.add("incomplete")
			canSend = false
		} else { $input("day").classList.remove("incomplete") }

		if (differentDays) {
			if ($input("second-day").value === '' || secondDate < deadline) {
				$input("second-day").classList.add("incomplete")
				canSend = false
			} else { $input("second-day").classList.remove("incomplete") }
		}

		// same-day same-hour check
		if (!differentDays) {
			if ($input("first-hour").value === $input("second-hour").value) {
				$input("first-hour").classList.add("incomplete")
				$input("second-hour").classList.add("incomplete")
				canSend = false
			} else {
				$input("first-hour").classList.remove("incomplete")
				$input("second-hour").classList.remove("incomplete")
			}
		}

		// topics amount check
		let filledTopics = Array.from($id("topics").children)
			.map(elm => elm.children[1].value).filter(text => text != '')
		if (filledTopics.length < MIN_TOPICS ||
				filledTopics.length > MAX_TOPICS) {
			$id("topic-field").classList.add("incomplete")
			canSend = false
		} else { $id("topic-field").classList.remove("incomplete") }

		// teachers amount check
		let chips = Array.from(document.getElementsByClassName("chip"))
		if (chips.length < MIN_TEACHERS || chips.length > MAX_TEACHERS) {
			$id("teachers-field").classList.add("incomplete")
			canSend = false
		} else {
			$id("teachers-field").classList.remove("incomplete")
		}

		if (canSend)
			$id("submit").removeAttribute("disabled")
		else
			$id("submit").setAttribute("disabled", null)

	}

	setInterval(validateForm, 1000)
})()

let removeThisTopic = elm => {
	let topic = elm.parentElement
	topic.classList.add("removed")
	setTimeout(_ => topic.parentElement.removeChild(topic), 200)
}
