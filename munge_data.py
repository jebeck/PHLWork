from __future__ import print_function
import csv
import sys
import json
import requests

# keyed by geoid of home census tract
home_tracts = {}

tract_geometries = {}

def parse_od(filename):
	"""Parse an origin-direction file."""

	# prefixes for the 11 counties of the PHL metropolitan area
	to_include = ['42101', '42045', '42091', '42017', '42029', '10003', '34015', '34007', '34033', '34005', '24015']

	with open('csv/' + filename) as f:
		rdr = csv.reader(f)
		header = rdr.next()
		for row in rdr:
			found = False
			home_id = row[1][:-4]
			work_id = row[0][:-4]
			# if we want to change to focus *only* on people who live (i.e., Home) in the 11 counties, then change this to
			# if (row[1][:5] in to_include):
			if (row[0][:5] in to_include) or (row[1][:5] in to_include):
				industry = ""
				industry_pair = (industry, 0)
				if row[9] != '0':
					industry = 'goodsProducing'
					industry_pair = (industry, int(row[9]))
				elif row[10] != '0':
					industry = 'tradeTransUtil'
					industry_pair = (industry, int(row[10]))
				elif row[11] != '0':
					industry = 'allOther'
					industry_pair = (industry, int(row[11]))
				try:
					work_tracts = home_tracts[home_id]['features']
					for w in work_tracts:
						if w['workTract'] == work_id:
							w['industries'][industry] += industry_pair[1]
							found = True
					if not found:
						if industry == 'goodsProducing':
							work_tracts.append({
								'type': 'Feature',
								'workTract': work_id,
								'geometry': get_tract_geometry(work_id),
								'industries': {'goodsProducing': industry_pair[1], 'tradeTransUtil': 0, 'allOther': 0}
								})
						elif industry == 'tradeTransUtil':
							work_tracts.append({
								'type': 'Feature',
								'workTract': work_id,
								'geometry': get_tract_geometry(work_id),
								'industries': {'goodsProducing': 0, 'tradeTransUtil': industry_pair[1], 'allOther': 0}
								})
						elif industry == 'allOther':
							work_tracts.append({
								'type': 'Feature',
								'workTract': work_id,
								'geometry': get_tract_geometry(work_id),
								'industries': {'goodsProducing': 0, 'tradeTransUtil': 0, 'allOther': industry_pair[1]}
								})
						found = False
				except KeyError:
					home_tracts[home_id] = {'type': 'FeatureCollection', 'features': [], 'modesOfTransport': {}, 'centroid_coordinates': []}
					if industry == 'goodsProducing':
						home_tracts[home_id]['features'].append({
							'type': 'Feature',
							'workTract': work_id,
							'geometry': get_tract_geometry(work_id),
							'industries': {'goodsProducing': industry_pair[1], 'tradeTransUtil': 0, 'allOther': 0}
							})
					elif industry == 'tradeTransUtil':
						home_tracts[home_id]['features'].append({
							'type': 'Feature',
							'workTract': work_id,
							'geometry': get_tract_geometry(work_id),
							'industries': {'goodsProducing': 0, 'tradeTransUtil': industry_pair[1], 'allOther': 0}
							})
					elif industry == 'allOther':
						home_tracts[home_id]['features'].append({
							'type': 'Feature',
							'workTract': work_id,
							'geometry': get_tract_geometry(work_id),
							'industries': {'goodsProducing': 0, 'tradeTransUtil': 0, 'allOther': industry_pair[1]}
							})

def get_tract_geometry(geoid):
	"""Return the geometry of the census tract in question, retrieved via the Census API."""

	try:
		tg = tract_geometries[geoid]

		return tg
	except KeyError:
		url = 'http://census.ire.org/geo/1.0/boundary-set/tracts/' + geoid

		r = requests.get(url)

		data = json.loads(r.text)

		tract_geometries[geoid] = data['simple_shape']

		return data['simple_shape']

def print_to_JSON():
	"""Print home_tracts to a single HUGE JSON file."""

	dmps = json.dumps(home_tracts, sort_keys=True, separators=(',', ':'), indent=4)

	with open('all.json', 'w') as f:
		print(dmps, file=f)

def print_to_dir():
	"""Print each entry in home_tracts to a separate JSON file (named with dictionary key)."""

	for k, v in home_tracts.iteritems():
		with open('json/' + k + '.json', 'w') as f:
			dmps = json.dumps(v, sort_keys=True, separators=(',', ': '), indent=2)
			print(dmps, file=f)

def main():

	od_files = ['pa_od_aux_JT00_2011', 'pa_od_main_JT00_2011', 'de_od_aux_JT00_2011', 'de_od_main_JT00_2011', 'md_od_aux_JT00_2011', 'md_od_main_JT00_2011', 'nj_od_aux_JT00_2011', 'nj_od_main_JT00_2011']

	print()

	for f in od_files:
		parse_od(f + ".csv")
		print("Finished file: " + f)
		print()

	print_to_dir()

if __name__ == '__main__':
	main()
		