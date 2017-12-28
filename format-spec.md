
```
{
	"materials": [
		{"color": "0xff0000", "texture": "wall.jpg"},
		{"color": "0xffffff", "texture": "roof.png"}
	],
	"blocks": [
		{
			"material": -1, /* -1: no material, >=0: index into material array */
			"position": [0, 0, 0],
			"rotation": 0, /* 0, 90, 180, 270 */
			"mirror": [false, false], /* mirrored on x/y */
			"block": "castle/wall"
		},
		{
			"material": 1,
			"position": [10, 0, 0],
			"rotation": 90,
			"mirror": [false, false],
			"block": "castle/roof"
		}
	],
	"environment": {
		"exposure": 1.4,
		"ambientOcclusion": "0.4"
	},
	"export": {
		...
	}
}
```


TBD
===
- apply scale to blocks? (requires UV projection, scale calculated such that edges always land on grid points)
