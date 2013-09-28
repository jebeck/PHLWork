import csv
import sys
import json

# keyed by geoid of home census tract
home_tracts = {}

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
					work_tracts = home_tracts[home_id]['workTracts']
					for w in work_tracts:
						if w['workTract'] == work_id:
							w['industries'][industry] += industry_pair[1]
							found = True
					if not found:
						if industry == 'goodsProducing':
							work_tracts.append({'workTract': work_id, 'industries': {'goodsProducing': industry_pair[1], 'tradeTransUtil': 0, 'allOther': 0}})
						elif industry == 'tradeTransUtil':
							work_tracts.append({'workTract': work_id, 'industries': {'goodsProducing': 0, 'tradeTransUtil': industry_pair[1], 'allOther': 0}})
						elif industry == 'allOther':
							work_tracts.append({'workTract': work_id, 'industries': {'goodsProducing': 0, 'tradeTransUtil': 0, 'allOther': industry_pair[1]}})
						found = False
				except KeyError:
					home_tracts[home_id] = {'workTracts': [], 'modesOfTransport': {}, 'centroid_coordinates': []}
					if industry == 'goodsProducing':
						home_tracts[home_id]['workTracts'].append({'workTract': work_id, 'industries': {'goodsProducing': industry_pair[1], 'tradeTransUtil': 0, 'allOther': 0}})
					elif industry == 'tradeTransUtil':
						home_tracts[home_id]['workTracts'].append({'workTract': work_id, 'industries': {'goodsProducing': 0, 'tradeTransUtil': industry_pair[1], 'allOther': 0}})
					elif industry == 'allOther':
						home_tracts[home_id]['workTracts'].append({'workTract': work_id, 'industries': {'goodsProducing': 0, 'tradeTransUtil': 0, 'allOther': industry_pair[1]}})

def print_to_JSON():

	dmps = json.dumps(home_tracts, sort_keys=True, separators=(',', ':'), indent=4)

	with open('all.json', 'w') as f:
		print >> f, dmps

def print_to_dir():

	for k, v in home_tracts.iteritems():
		with open('json/' + k + '.json', 'w') as f:
			dmps = json.dumps(v, sort_keys=True, separators=(',', ':'), indent=4)
			print >> f, dmps

def main():

	od_files = ['pa_od_aux_JT00_2011', 'pa_od_main_JT00_2011', 'de_od_aux_JT00_2011', 'de_od_main_JT00_2011', 'md_od_aux_JT00_2011', 'md_od_main_JT00_2011', 'nj_od_aux_JT00_2011', 'nj_od_main_JT00_2011']

	for f in od_files:
		parse_od(f + ".csv")

	print_to_dir()

if __name__ == '__main__':
	main()
		