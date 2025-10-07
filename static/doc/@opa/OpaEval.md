The **@opa/OPA Eval** operation calls the local [OPA](https://www.openpolicyagent.org/) server to evaluate a policy against either an array or a single JSON document.  
This operation requires [ASP Chef CLI](https://github.com/alviano/asp-chef-cli) and a running local server (for example: `python3 -m asp_chef_cli server`).
> For the ASP Chef CLI it is recommended using a Python virtual environment (e.g., `poetry install && poetry run python3 asp_chef_cli server`).

Start the OPA evaluator server with `opa run -s`

§§§§

Create your policy using the standard OPA format.
The easiest way to use it in ASP Chef is through an _Encode_ ingredient:

```
package policy

decisions := [res |
    some i
    req := input[i]
    res := {
        "user":   req.user.name,
        "action": req.request.path,
        "method": req.request.method,
        "allow":  allow_request(req)
    }
]

allow_request(req) if {
    req.user.roles[_] == "admin"
}

allow_request(req) if {
    startswith(req.request.path, "/public")
    req.request.method == "GET"
}

allow_request(req) if {
    req.user.roles[_] == "user"
    req.request.method == "GET"
    req.request.path == "/login"
}
```

Add another _Encode_ ingredient for the test requests, for example:

```json
[
    {
        "user": {
            "name": "Pietro",
            "roles": ["developer", "dbadmin", "test"]
        },
        "request": {
            "method": "GET",
            "path": "/public/resource/image.png"
        }
    },
    {
        "user": {
            "name": "Maria",
            "roles": ["manager", "hr"]
        },
        "request": {
            "method": "POST",
            "path": "/api/resource/create"
        }
    },
    {
        "user": {
            "name": "Luca",
            "roles": ["analyst"]
        },
        "request": {
            "method": "DELETE",
            "path": "/api/resource/delete/123"
        }
    },
    {
        "user": {
            "name": "Giulia",
            "roles": ["developer", "tester"]
        },
        "request": {
            "method": "PUT",
            "path": "/api/resource/update/456"
        }
    },
    {
        "user": {
            "name": "Admin",
            "roles": ["admin"]
        },
        "request": {
            "method": "POST",
            "path": "/admin/resource"
        }
    },
    {
        "user": {
            "name": "Marco",
            "roles": ["user"]
        },
        "request": {
            "method": "GET",
            "path": "/login"
        }
    },
    {
        "user": {
            "name": "Elena",
            "roles": ["user"]
        },
        "request": {
            "method": "GET",
            "path": "/public/resource/document.pdf"
        }
    },
    {
        "user": {
            "name": "Sofia",
            "roles": ["guest"]
        },
        "request": {
            "method": "GET",
            "path": "/public/resource/info.txt"
        }
    },
    {
        "user": {
            "name": "Giorgio",
            "roles": ["admin"]
        },
        "request": {
            "method": "DELETE",
            "path": "/admin/resource/789"
        }
    },
    {
        "user": {
            "name": "Chiara",
            "roles": ["user"]
        },
        "request": {
            "method": "GET",
            "path": "/login"
        }
    }
]
```

Finally, add this ingredient, set the predicate names, and decide whether the server should return only allowed requests.

Example of the expected output for the JSON above:

```json
[
    {"action": "/public/resource/image.png", "allow": True, "method": "GET", "user": "Pietro"},
    {"action": "/admin/resource", "allow": True, "method": "POST", "user": "Admin"},
    {"action": "/login", "allow": True, "method": "GET", "user": "Marco"},
    {"action": "/public/resource/document.pdf","allow": True, "method": "GET", "user": "Elena"},
    {"action": "/public/resource/info.txt", "allow": True, "method": "GET", "user": "Sofia"},
    {"action": "/admin/resource/789", "allow": True, "method": "DELETE", "user": "Giorgio"},
    {"action": "/login", "allow": True, "method": "GET", "user": "Chiara"}
]
```
